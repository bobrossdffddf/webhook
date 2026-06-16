module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN || 'PASTE_BOT_TOKEN',
  GUILD_ID: process.env.GUILD_ID || 'PASTE_SERVER_ID',
  REVIEW_CHANNEL_ID: process.env.REVIEW_CHANNEL_ID || 'PASTE_REVIEW_CHANNEL_ID',

  WEBHOOK_ID: process.env.WEBHOOK_ID || '1516322885420191745',
  WEBHOOK_TOKEN: process.env.WEBHOOK_TOKEN || '6coNyciHnJxW9uChkh-xVdX2QOcrwK-gNp59VA6VXZkZBRG0QzLHuJT3vEVz9qNNqNT6',

  APPS_SCRIPT_URL: process.env.APPS_SCRIPT_URL || 'PASTE_APPS_SCRIPT_WEBAPP_URL',
  POLL_SECRET: process.env.POLL_SECRET || 'change-this-to-a-long-random-string',
  POLL_INTERVAL_MS: 20000,

  REVIEWER_ROLE_IDS: [],

  PING_ROLE_IDS: ['1516190385943351316'],
  TITLE_EMOJI: '<:unknown:1516243511706390719>',
  ACCEPT_EMOJI_ID: '1516247490788065390',
  DENY_EMOJI_ID: '1516243541582413974',

  HEADER_IMAGE: 'https://i.postimg.cc/nhQWfWq9/content.png',
  FOOTER_IMAGE: 'https://i.postimg.cc/NjrnvnRs/New-Project-2.png',
  RESULTS_EMOJI: '<:unknown:1516181718548217976>',
  ACCENT_ACCEPT: 3381593,
  ACCENT_DENY: 16711687,

  FORMS: {
    civstaff: {
      rolesToGrant: ['1516191557366321163', '1516226139339882577'],
      acceptText: 'Congrats! You were accepted to be a Civilian Operation Staff member.',
      denyText: 'We are sorry but at this time you were not accepted to be a Civilian Operation Staff member.'
    },
    certciv: {
      rolesToGrant: ['1516193287344623747', '1516193328771629238'],
      acceptText: 'Congrats! You were accepted to be a Certified Civilian!',
      denyText: 'We are sorry but at this time you were not accepted to be a Certified Civilian.'
    }
  }
};
