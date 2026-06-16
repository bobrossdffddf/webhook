// Run ONCE: node create-webhook.js
// Creates an application-owned webhook in your review channel and prints the
// values you need. Because the bot creates it, its buttons route back to the bot.

const { REST, Routes } = require('discord.js');
const cfg = require('./config');

(async () => {
  if (!cfg.REVIEW_CHANNEL_ID || cfg.REVIEW_CHANNEL_ID.startsWith('PASTE')) {
    throw new Error('Set REVIEW_CHANNEL_ID in config.js first.');
  }
  const rest = new REST({ version: '10' }).setToken(cfg.BOT_TOKEN);
  const wh = await rest.post(Routes.channelWebhooks(cfg.REVIEW_CHANNEL_ID), {
    body: { name: 'Applications' }
  });

  console.log('\nWebhook created. Copy these:\n');
  console.log('  config.js  -> WEBHOOK_ID:    ' + wh.id);
  console.log('  config.js  -> WEBHOOK_TOKEN: ' + wh.token);
  console.log('\n  Code.gs    -> WEBHOOK_URL:');
  console.log('  https://discord.com/api/v10/webhooks/' + wh.id + '/' + wh.token + '\n');
})().catch((e) => { console.error(e); process.exit(1); });
