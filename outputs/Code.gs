const POLL_SECRET = 'change-this-to-a-long-random-string';

const FORM_KEYS = {
  'CWRPVC | Civilian Staff Application': 'civstaff',
  'CWRPVC | Certified Civilian Application': 'certciv'
};
const DISCORD_ID_HINT = 'discord';

function onFormSubmit(e) {
  const formName = e && e.source ? e.source.getTitle() : FormApp.getActiveForm().getTitle();
  const responses = e && e.response ? e.response.getItemResponses() : [];
  const sub = {
    formName: formName,
    key: FORM_KEYS[formName] || '',
    applicantId: findDiscordId(responses) || '0',
    answers: responses.map(function (r) { return { q: r.getItem().getTitle(), a: r.getResponse() }; })
  };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    PropertiesService.getScriptProperties()
      .setProperty('q_' + Date.now() + '_' + Math.floor(Math.random() * 1e6), JSON.stringify(sub));
  } finally {
    lock.releaseLock();
  }
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

function doGet(e) {
  if (!e || e.parameter.secret !== POLL_SECRET) return out({ error: 'unauthorized' });
  const props = PropertiesService.getScriptProperties();
  if (e.parameter.ack) {
    props.deleteProperty(e.parameter.ack);
    return out({ ok: true });
  }
  const all = props.getProperties();
  const items = [];
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('q_') === 0) {
      try { items.push({ id: k, data: JSON.parse(all[k]) }); } catch (err) {}
    }
  });
  return out({ items: items });
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function installTrigger() {
  const form = FormApp.getActiveForm();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onFormSubmit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onFormSubmit').forForm(form).onFormSubmit().create();
}
