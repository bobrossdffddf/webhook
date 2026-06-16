// Posts each form submission to Discord as the BOT (so the Accept/Deny
// buttons are live). The bot process handles the clicks, role grants and DMs.

// ============================ CONFIG ============================
// The application-owned webhook URL printed by `node create-webhook.js`.
const WEBHOOK_URL = 'PASTE_APP_WEBHOOK_URL';

// Roles pinged when an application comes in. Add as many as you want.
const PING_ROLE_IDS = ['1516190385943351316'];

const HEADER_IMAGE = 'https://i.postimg.cc/nhQWfWq9/content.png';
const FOOTER_IMAGE = 'https://i.postimg.cc/NjrnvnRs/New-Project-2.png';
const TITLE_EMOJI = '<:unknown:1516243511706390719>';
const ACCEPT_EMOJI_ID = '1516247490788065390';
const DENY_EMOJI_ID = '1516243541582413974';

// Exact form title -> short key. The key must match a block in the bot's config.js.
const FORM_KEYS = {
  'CWRPVC | Civilian Staff Application': 'civstaff',
  'CWRPVC | Certified Civilian Application': 'certciv'
};

// The question whose title contains this word holds the applicant's Discord ID.
const DISCORD_ID_HINT = 'discord';

const MAX_ANSWER_CHARS = 1000;
const MAX_QUESTIONS = 14;
// ===============================================================

function onFormSubmit(e) {
  const formName = e && e.source ? e.source.getTitle() : FormApp.getActiveForm().getTitle();
  const responses = e && e.response ? e.response.getItemResponses() : [];
  const key = FORM_KEYS[formName] || '';
  const applicantId = findDiscordId(responses) || '0';
  postMessage(buildPayload(formName, key, applicantId, responses));
}

function findDiscordId(responses) {
  for (let i = 0; i < responses.length; i++) {
    if (responses[i].getItem().getTitle().toLowerCase().indexOf(DISCORD_ID_HINT) !== -1) {
      const digits = String(responses[i].getResponse() || '').replace(/\D/g, '');
      if (digits.length >= 17 && digits.length <= 20) return digits;
    }
  }
  return '';
}

function buildPayload(formName, key, applicantId, responses) {
  const container = {
    type: 17,
    components: [
      { type: 12, items: [{ media: { url: HEADER_IMAGE } }] },
      { type: 10, content: '# ' + TITLE_EMOJI + ' Application Submitted\nA new application has been submitted.' },
      { type: 14, spacing: 2 },
      { type: 10, content: '## Form: `' + escapeTicks(formName) + '`' }
    ]
  };

  const count = Math.min(responses.length, MAX_QUESTIONS);
  for (let i = 0; i < count; i++) {
    const q = escapeTicks(responses[i].getItem().getTitle());
    const a = formatAnswer(responses[i].getResponse());
    container.components.push({ type: 14, spacing: 2 });
    container.components.push({ type: 10, content: '### Q' + (i + 1) + ': ' + q + '\n' + a });
  }
  container.components.push({ type: 14, spacing: 2 });
  container.components.push({ type: 12, items: [{ media: { url: FOOTER_IMAGE } }] });

  const ping = PING_ROLE_IDS.map(function (id) { return '<@&' + id + '>'; }).join(' ');

  const buttons = {
    type: 1,
    components: [
      { type: 2, style: 3, label: 'Accept', emoji: { id: ACCEPT_EMOJI_ID, name: 'unknown' }, custom_id: 'acc|' + key + '|' + applicantId },
      { type: 2, style: 4, label: 'Deny', emoji: { id: DENY_EMOJI_ID, name: 'unknown' }, custom_id: 'den|' + key + '|' + applicantId }
    ]
  };

  return {
    flags: 32768,
    components: [{ type: 10, content: ping }, container, buttons],
    allowed_mentions: { parse: [], roles: PING_ROLE_IDS }
  };
}

function formatAnswer(value) {
  if (Array.isArray(value)) {
    value = value.map(function (v) { return Array.isArray(v) ? v.join(' / ') : v; }).join(', ');
  }
  let text = value === null || value === undefined || value === '' ? 'No answer' : String(value);
  if (text.length > MAX_ANSWER_CHARS) text = text.substring(0, MAX_ANSWER_CHARS - 3) + '...';
  if (text.indexOf('\n') !== -1) return '```\n' + text.replace(/```/g, 'ʼʼʼ') + '\n```';
  return '`' + text.replace(/`/g, 'ʼ') + '`';
}

function escapeTicks(text) {
  return String(text == null ? '' : text).replace(/`/g, 'ʼ');
}

function postMessage(payload) {
  const url = WEBHOOK_URL + (WEBHOOK_URL.indexOf('?') === -1 ? '?' : '&') + 'with_components=true';
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  if (code < 200 || code >= 300) throw new Error('Discord ' + code + ': ' + res.getContentText());
}

function installTrigger() {
  const form = FormApp.getActiveForm();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onFormSubmit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onFormSubmit').forForm(form).onFormSubmit().create();
}
