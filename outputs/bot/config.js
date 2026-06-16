// All the values you'll edit live here.
// Prefer environment variables for secrets; the fallbacks are for quick testing.

module.exports = {
  // Same bot used by the Apps Script. Discord Developer Portal -> Bot -> Token.
  BOT_TOKEN: process.env.BOT_TOKEN || 'PASTE_BOT_TOKEN',

  // Your server (guild) ID. Right-click the server icon -> Copy Server ID (Developer Mode on).
  GUILD_ID: process.env.GUILD_ID || 'PASTE_SERVER_ID',

  // Who is allowed to press Accept/Deny. Empty array = anyone in the channel can.
  REVIEWER_ROLE_IDS: [],

  // Shared visuals.
  HEADER_IMAGE: 'https://i.postimg.cc/nhQWfWq9/content.png',
  FOOTER_IMAGE: 'https://i.postimg.cc/NjrnvnRs/New-Project-2.png',
  RESULTS_EMOJI: '<:unknown:1516181718548217976>',

  // Container accent colors (decimal) for the edited message.
  ACCENT_ACCEPT: 3381593,   // green
  ACCENT_DENY: 16711687,    // red

  // Per-form behavior. The key here must match the key Apps Script puts in the
  // button (FORM_KEYS in Code.gs). Add more forms by copying a block.
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
