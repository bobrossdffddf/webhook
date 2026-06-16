const WEBHOOK_URL = 'PASTE_YOUR_DISCORD_WEBHOOK_URL_HERE';
const ROLE_ID = '1516190385943351316';
const PING_ROLE = true;
const HEADER_IMAGE_URL = 'https://i.postimg.cc/nhQWfWq9/content.png';
const TITLE_EMOJI = '<:unknown:1516243511706390719>';
const MAX_ANSWER_CHARS = 1000;
const MAX_QUESTIONS = 16;

function onFormSubmit(e) {
  const formName = e && e.source ? e.source.getTitle() : FormApp.getActiveForm().getTitle();
  const responses = e && e.response ? e.response.getItemResponses() : [];
  postToDiscord(buildPayload(formName, responses));
}

function buildPayload(formName, responses) {
  const container = {
    type: 17,
    components: [
      { type: 12, items: [{ media: { url: HEADER_IMAGE_URL } }] },
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

  return {
    flags: 32768,
    components: [
      { type: 10, content: '<@&' + ROLE_ID + '>' },
      container
    ],
    allowed_mentions: PING_ROLE ? { parse: [], roles: [ROLE_ID] } : { parse: [] }
  };
}

function formatAnswer(value) {
  if (Array.isArray(value)) {
    value = value.map(function (v) { return Array.isArray(v) ? v.join(' / ') : v; }).join(', ');
  }
  let text = value === null || value === undefined || value === '' ? 'No answer' : String(value);
  if (text.length > MAX_ANSWER_CHARS) text = text.substring(0, MAX_ANSWER_CHARS - 3) + '...';
  if (text.indexOf('\n') !== -1) return '```\n' + text.replace(/```/g, "ʼʼʼ") + '\n```';
  return '`' + text.replace(/`/g, "ʼ") + '`';
}

function escapeTicks(text) {
  return String(text == null ? '' : text).replace(/`/g, "ʼ");
}

function postToDiscord(payload) {
  const url = WEBHOOK_URL + (WEBHOOK_URL.indexOf('?') === -1 ? '?' : '&') + 'with_components=true';
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  if (code < 200 || code >= 300) throw new Error('Webhook ' + code + ': ' + res.getContentText());
}

function installTrigger() {
  const form = FormApp.getActiveForm();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onFormSubmit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onFormSubmit').forForm(form).onFormSubmit().create();
}

function testSend() {
  const r = function (t, a) { return { getItem: function () { return { getTitle: function () { return t; } }; }, getResponse: function () { return a; } }; };
  const responses = [
    r('Question1', 'Answer'), r('Question2', 'Answer'), r('Question3', 'Answer'),
    r('Question4', 'Answer'), r('Question5', 'Answer'), r('Question6', ['Option2', 'Option3'])
  ];
  postToDiscord(buildPayload(FormApp.getActiveForm().getTitle(), responses));
}
