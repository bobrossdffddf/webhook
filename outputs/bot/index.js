const {
  Client, GatewayIntentBits, Events, Routes,
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder,
  MessageFlags
} = require('discord.js');
const cfg = require('./config');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const EPHEMERAL = { flags: MessageFlags.Ephemeral };

const esc = (s) => String(s == null ? '' : s).replace(/`/g, 'ʼ');
const img = (url) => ({ type: 12, items: [{ media: { url } }] });

client.once(Events.ClientReady, (c) => console.log('Logged in as ' + c.user.tag));

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isButton()) return onButton(interaction);
    if (interaction.isModalSubmit()) return onModal(interaction);
  } catch (err) {
    console.error(err);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      interaction.reply({ content: 'Something went wrong.', ...EPHEMERAL }).catch(() => {});
    }
  }
});

function reviewerAllowed(interaction) {
  if (!cfg.REVIEWER_ROLE_IDS.length) return true;
  const roles = interaction.member && interaction.member.roles;
  if (!roles) return false;
  const ids = roles.cache ? [...roles.cache.keys()] : roles;
  return cfg.REVIEWER_ROLE_IDS.some((r) => ids.includes(r));
}

// Accept/Deny click -> open a reason modal. Context is carried in the modal's custom_id.
async function onButton(interaction) {
  const [action, key, applicantId] = interaction.customId.split('|');
  if (action !== 'acc' && action !== 'den') return;

  if (!reviewerAllowed(interaction)) {
    return interaction.reply({ content: "You don't have permission to review applications.", ...EPHEMERAL });
  }

  const modal = new ModalBuilder()
    .setCustomId('m' + action + '|' + key + '|' + applicantId + '|' + interaction.message.id)
    .setTitle(action === 'acc' ? 'Accept Application' : 'Deny Application');

  const reason = new TextInputBuilder()
    .setCustomId('reason')
    .setLabel(action === 'acc' ? 'Reason for acceptance' : 'Reason for denial')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(1000);

  modal.addComponents(new ActionRowBuilder().addComponents(reason));
  await interaction.showModal(modal);
}

// Modal submitted -> edit the original message, grant roles (accept), DM the applicant.
async function onModal(interaction) {
  const [tag, key, applicantId, messageId] = interaction.customId.split('|');
  const action = tag.slice(1);
  if (action !== 'acc' && action !== 'den') return;

  await interaction.deferReply(EPHEMERAL);

  const rest = client.rest;
  const channelId = interaction.channelId;
  const modId = interaction.user.id;
  const reason = (interaction.fields.getTextInputValue('reason') || '').trim() || 'No reason provided';
  const form = cfg.FORMS[key];
  const validId = /^\d{17,20}$/.test(applicantId);

  let original;
  try {
    original = await rest.get(Routes.channelMessage(channelId, messageId));
  } catch (e) {
    return interaction.editReply('Could not load the original message (was it deleted?).');
  }

  const existingRow = original.components.find((c) => c.type === 1);
  if (existingRow && existingRow.components[0] && existingRow.components[0].disabled) {
    return interaction.editReply('This application was already handled.');
  }

  const accent = action === 'acc' ? cfg.ACCENT_ACCEPT : cfg.ACCENT_DENY;
  const footer = action === 'acc'
    ? '-# Accepted by: <@' + modId + '>\n## `' + esc(reason) + '`'
    : '-# Denied by: <@' + modId + '>\n## `' + esc(reason) + '`';
  await editMessage(rest, channelId, messageId, accent, footer);

  const notes = [];
  if (!form) notes.push('⚠️ Unknown form key — could not map roles or result text.');

  if (action === 'acc' && form) {
    if (validId) {
      let granted = 0;
      for (const roleId of form.rolesToGrant) {
        try {
          await rest.put(Routes.guildMemberRole(cfg.GUILD_ID, applicantId, roleId), {
            reason: 'Application accepted by ' + interaction.user.tag
          });
          granted++;
        } catch (e) {
          notes.push('⚠️ Could not add role ' + roleId + ' (check bot permission / role hierarchy).');
        }
      }
      if (granted) notes.push('✅ Granted ' + granted + ' role(s) to <@' + applicantId + '>.');
    } else {
      notes.push('⚠️ No valid Discord ID on this application — no roles granted.');
    }
  }

  if (form && validId) {
    const dm = action === 'acc' ? acceptDM(form) : denyDM(form, reason);
    const ok = await dmUser(rest, applicantId, dm);
    notes.push(ok ? '✅ DMed the applicant.' : '⚠️ Could not DM the applicant (DMs closed?).');
  } else if (form && !validId) {
    notes.push('⚠️ No valid Discord ID — applicant not DMed.');
  }

  await interaction.editReply((action === 'acc' ? 'Accepted.' : 'Denied.') + '\n' + notes.join('\n'));
}

function stripIds(components) {
  for (const c of components) {
    delete c.id;
    if (Array.isArray(c.components)) stripIds(c.components);
  }
}

async function editMessage(rest, channelId, messageId, accent, footerLine) {
  const msg = await rest.get(Routes.channelMessage(channelId, messageId));
  const container = msg.components.find((c) => c.type === 17);
  const row = msg.components.find((c) => c.type === 1);

  if (container) {
    container.accent_color = accent;
    container.components.push({ type: 14, spacing: 2 });
    container.components.push({ type: 10, content: footerLine });
  }
  if (row) for (const b of row.components) { b.disabled = true; b.style = 2; }

  const out = [container, row].filter(Boolean); // drops the role-ping line
  stripIds(out);

  await rest.patch(Routes.channelMessage(channelId, messageId), {
    body: { flags: 32768, components: out }
  });
}

async function dmUser(rest, userId, components) {
  try {
    const dm = await rest.post(Routes.userChannels(), { body: { recipient_id: userId } });
    await rest.post(Routes.channelMessages(dm.id), { body: { flags: 32768, components } });
    return true;
  } catch (e) {
    console.error('DM failed:', e && e.message);
    return false;
  }
}

function acceptDM(form) {
  return [{
    type: 17,
    components: [
      img(cfg.HEADER_IMAGE),
      { type: 10, content: '# ' + cfg.RESULTS_EMOJI + '  - Application Results!' },
      { type: 10, content: form.acceptText },
      { type: 14, spacing: 2 },
      img(cfg.FOOTER_IMAGE)
    ]
  }];
}

function denyDM(form, reason) {
  return [{
    type: 17,
    components: [
      img(cfg.HEADER_IMAGE),
      { type: 10, content: '# ' + cfg.RESULTS_EMOJI + ' - Application Results\n' + form.denyText + '\n\n**Reason:**\n`' + esc(reason) + '`' },
      { type: 14, spacing: 2 },
      img(cfg.FOOTER_IMAGE)
    ]
  }];
}

client.login(cfg.BOT_TOKEN);
