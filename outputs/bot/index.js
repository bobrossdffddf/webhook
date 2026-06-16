const {
  Client, GatewayIntentBits, Events, Routes,
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags
} = require('discord.js');
const cfg = require('./config');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const EPHEMERAL = { flags: MessageFlags.Ephemeral };
const YES = '<:Yes:1516247490788065390>';
const NO = '<:Wrong:1516243541582413974>';

const esc = (s) => String(s == null ? '' : s).replace(/`/g, 'ʼ');
const img = (url) => ({ type: 12, items: [{ media: { url } }] });

client.once(Events.ClientReady, (c) => {
  console.log('Logged in as ' + c.user.tag);
  poll();
  setInterval(poll, cfg.POLL_INTERVAL_MS);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isButton()) return onButton(interaction);
    if (interaction.isModalSubmit()) return onModal(interaction);
  } catch (err) {
    console.error(err);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      interaction.reply({ content: NO + ' Something went wrong.', ...EPHEMERAL }).catch(() => {});
    }
  }
});

async function poll() {
  let body;
  try {
    const res = await fetch(cfg.APPS_SCRIPT_URL + '?secret=' + encodeURIComponent(cfg.POLL_SECRET));
    body = await res.json();
  } catch (e) {
    return;
  }
  for (const item of (body.items || [])) {
    try {
      await postCard(item.data);
      await fetch(cfg.APPS_SCRIPT_URL + '?secret=' + encodeURIComponent(cfg.POLL_SECRET) + '&ack=' + encodeURIComponent(item.id));
    } catch (e) {
      console.error('post failed, retrying next cycle:', e && e.message);
    }
  }
}

function buildCard(data) {
  const container = {
    type: 17,
    components: [
      img(cfg.HEADER_IMAGE),
      { type: 10, content: '# ' + cfg.TITLE_EMOJI + ' Application Submitted\nA new application has been submitted.' },
      { type: 14, spacing: 2 },
      { type: 10, content: '## Form: `' + esc(data.formName) + '`' }
    ]
  };
  (data.answers || []).slice(0, 16).forEach((qa, i) => {
    container.components.push({ type: 14, spacing: 2 });
    container.components.push({ type: 10, content: '### Q' + (i + 1) + ': ' + esc(qa.q) + '\n' + answer(qa.a) });
  });
  container.components.push({ type: 14, spacing: 2 });
  container.components.push(img(cfg.FOOTER_IMAGE));

  const ping = cfg.PING_ROLE_IDS.map((id) => '<@&' + id + '>').join(' ');
  const buttons = {
    type: 1,
    components: [
      { type: 2, style: 3, label: 'Accept', emoji: { id: cfg.ACCEPT_EMOJI_ID, name: 'unknown' }, custom_id: 'acc|' + (data.key || '') + '|' + (data.applicantId || '0') },
      { type: 2, style: 4, label: 'Deny', emoji: { id: cfg.DENY_EMOJI_ID, name: 'unknown' }, custom_id: 'den|' + (data.key || '') + '|' + (data.applicantId || '0') }
    ]
  };
  return {
    flags: 32768,
    components: [{ type: 10, content: ping }, container, buttons],
    allowed_mentions: { parse: [], roles: cfg.PING_ROLE_IDS }
  };
}

function answer(value) {
  if (Array.isArray(value)) value = value.map((v) => (Array.isArray(v) ? v.join(' / ') : v)).join(', ');
  let t = value === null || value === undefined || value === '' ? 'No answer' : String(value);
  if (t.length > 1000) t = t.substring(0, 997) + '...';
  if (t.indexOf('\n') !== -1) return '```\n' + t.replace(/```/g, 'ʼʼʼ') + '\n```';
  return '`' + t.replace(/`/g, 'ʼ') + '`';
}

async function postCard(data) {
  const url = 'https://discord.com/api/v10/webhooks/' + cfg.WEBHOOK_ID + '/' + cfg.WEBHOOK_TOKEN + '?with_components=true';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildCard(data))
  });
  if (!res.ok) throw new Error('webhook ' + res.status + ' ' + (await res.text()));
}

function reviewerAllowed(interaction) {
  if (!cfg.REVIEWER_ROLE_IDS.length) return true;
  const roles = interaction.member && interaction.member.roles;
  if (!roles) return false;
  const ids = roles.cache ? [...roles.cache.keys()] : roles;
  return cfg.REVIEWER_ROLE_IDS.some((r) => ids.includes(r));
}

async function onButton(interaction) {
  const [action, key, applicantId] = interaction.customId.split('|');
  if (action !== 'acc' && action !== 'den') return;
  if (!reviewerAllowed(interaction)) {
    return interaction.reply({ content: NO + " You can't review applications.", ...EPHEMERAL });
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

async function onModal(interaction) {
  const [tag, key, applicantId, messageId] = interaction.customId.split('|');
  const action = tag.slice(1);
  if (action !== 'acc' && action !== 'den') return;

  await interaction.deferReply(EPHEMERAL);

  const rest = client.rest;
  const modId = interaction.user.id;
  const reason = (interaction.fields.getTextInputValue('reason') || '').trim() || 'No reason provided';
  const form = cfg.FORMS[key];
  const validId = /^\d{17,20}$/.test(applicantId);

  let original;
  try {
    original = await rest.get(Routes.webhookMessage(cfg.WEBHOOK_ID, cfg.WEBHOOK_TOKEN, messageId));
  } catch (e) {
    return interaction.editReply(NO + ' Could not load the original message (deleted?).');
  }

  const row = original.components.find((c) => c.type === 1);
  if (row && row.components[0] && row.components[0].disabled) {
    return interaction.editReply(NO + ' This one was already handled.');
  }

  const accent = action === 'acc' ? cfg.ACCENT_ACCEPT : cfg.ACCENT_DENY;
  const footer = action === 'acc'
    ? '-# Accepted by: <@' + modId + '>\n## `' + esc(reason) + '`'
    : '-# Denied by: <@' + modId + '>\n## `' + esc(reason) + '`';
  await editMessage(rest, messageId, accent, footer);

  const notes = [];
  if (!form) notes.push(NO + ' Unknown form key, no roles or DM mapped.');

  if (action === 'acc' && form) {
    if (validId) {
      let granted = 0;
      for (const roleId of form.rolesToGrant) {
        try {
          await rest.put(Routes.guildMemberRole(cfg.GUILD_ID, applicantId, roleId), {
            reason: 'Accepted by ' + interaction.user.tag
          });
          granted++;
        } catch (e) {
          notes.push(NO + ' Could not add role ' + roleId + ' (permission / hierarchy).');
        }
      }
      if (granted) notes.push(YES + ' Gave ' + granted + ' role(s) to <@' + applicantId + '>.');
    } else {
      notes.push(NO + ' No valid Discord ID, no roles given.');
    }
  }

  if (form && validId) {
    const dm = action === 'acc' ? acceptDM(form) : denyDM(form, reason);
    const ok = await dmUser(rest, applicantId, dm);
    notes.push(ok ? YES + ' DMed them.' : NO + ' Could not DM them (DMs closed?).');
  } else if (form && !validId) {
    notes.push(NO + ' No valid Discord ID, not DMed.');
  }

  await interaction.editReply((action === 'acc' ? 'Accepted.' : 'Denied.') + '\n' + notes.join('\n'));
}

function stripIds(components) {
  for (const c of components) {
    delete c.id;
    if (Array.isArray(c.components)) stripIds(c.components);
  }
}

async function editMessage(rest, messageId, accent, footerLine) {
  const route = Routes.webhookMessage(cfg.WEBHOOK_ID, cfg.WEBHOOK_TOKEN, messageId);
  const msg = await rest.get(route);
  const container = msg.components.find((c) => c.type === 17);
  const row = msg.components.find((c) => c.type === 1);
  if (container) {
    container.accent_color = accent;
    container.components.push({ type: 14, spacing: 2 });
    container.components.push({ type: 10, content: footerLine });
  }
  if (row) for (const b of row.components) { b.disabled = true; b.style = 2; }
  const out = [container, row].filter(Boolean);
  stripIds(out);
  await rest.patch(route, {
    body: { flags: 32768, components: out },
    query: new URLSearchParams({ with_components: 'true' })
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
