# Application system — setup

How it's wired (important): Apps Script **never calls Discord**. It saves each
submission and exposes it at a Google-hosted Web App URL. The bot **polls** that
URL every ~20s and posts the card from its own IP. That's what kills the 1015 /
40333 rate-limits, and nothing inbound ever hits your host.

```
Form submit -> Apps Script queue -> (bot polls) -> bot posts card -> buttons -> bot grants roles / DMs
```

---

## 1. Discord application + bot

1. https://discord.com/developers/applications -> New Application.
2. Bot -> Reset Token -> copy it (this is BOT_TOKEN). No privileged intents needed.
3. Leave the **Interactions Endpoint URL blank** so clicks come over the gateway.
4. Invite it (replace APPLICATION_ID):
   `https://discord.com/oauth2/authorize?client_id=APPLICATION_ID&scope=bot&permissions=536872960`
   (Manage Roles + View Channel + Send Messages + Manage Webhooks)
5. Server Settings -> Roles: drag the **bot's role above** the roles it grants.

The webhook from before is already filled into config.js (WEBHOOK_ID / WEBHOOK_TOKEN).
Only re-run `node create-webhook.js` if you ever need a new one.

## 2. Apps Script

1. Open the form -> Apps Script, paste `Code.gs`.
2. Set `POLL_SECRET` to a long random string.
3. Check `FORM_KEYS` maps each form's exact title to its key.
4. Run `installTrigger` once and approve.
5. **Deploy -> New deployment -> Web app**: Execute as = you, Who has access = **Anyone**. Deploy and copy the `/exec` URL.

Re-deploy a new version whenever you edit `Code.gs` (Deploy -> Manage deployments -> edit -> Version: New).

## 3. Bot config + run

In `bot/config.js` set:

- `BOT_TOKEN`, `GUILD_ID`
- `APPS_SCRIPT_URL` = the `/exec` URL from step 2
- `POLL_SECRET` = the **same** string you put in `Code.gs`
- (optional) `REVIEWER_ROLE_IDS` to limit who can press Accept/Deny

Then:

```
cd bot
npm install
node index.js          # or: pm2 start index.js --name applications
```

`Logged in as ...` means it's up. Keep it running 24/7. New submissions appear
within ~20 seconds.

---

## How it flows

1. Form submitted -> queued in Apps Script -> bot picks it up and posts the card (pings, answers, two images, Accept/Deny).
2. A reviewer clicks Accept or Deny -> modal asks for a reason.
3. On submit:
   - Accept -> grants that form's roles to the applicant, edits the card (green, buttons disabled, "Accepted by + reason"), DMs the acceptance.
   - Deny -> edits the card (red, disabled, "Denied by + reason"), DMs the denial with the reason.

Applicant = the form question whose title contains "discord". It must hold their numeric Discord ID.

## Adding another form later

1. `Code.gs` `FORM_KEYS`: add `'<exact form title>': '<newkey>'`.
2. `bot/config.js` `FORMS`: add a `<newkey>` block with `rolesToGrant`, `acceptText`, `denyText`.
3. Paste `Code.gs` into that form, run `installTrigger`, re-deploy the web app, restart the bot.

## Notes

- Up to ~20s between submit and the card appearing (poll interval, tune `POLL_INTERVAL_MS`).
- Custom emojis / roles only resolve inside the server that owns them.
- No valid Discord ID -> card still marked, but no roles/DM (reviewer gets a notice).
- Keep `BOT_TOKEN`, the webhook token, and `POLL_SECRET` private.
