module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN || 'PASTE_BOT_TOKEN',
  GUILD_ID: process.env.GUILD_ID || 'PASTE_SERVER_ID',
  REVIEW_CHANNEL_ID: process.env.REVIEW_CHANNEL_ID || 'PASTE_REVIEW_CHANNEL_ID',
  WEBHOOK_ID: process.env.WEBHOOK_ID || 'PASTE_WEBHOOK_ID',
  WEBHOOK_TOKEN: process.env.WEBHOOK_TOKEN || 'PASTE_WEBHOOK_TOKEN',

  REVIEWER_ROLE_IDS: [],

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
