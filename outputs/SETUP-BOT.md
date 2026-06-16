# Application system — setup

Two pieces work together:

- **Apps Script (`Code.gs`)** — runs on form submit, posts the application card to Discord *as the bot* so the Accept/Deny buttons are live.
- **Bot (`bot/`)** — a small always-on Node app that handles the button clicks: opens the reason modal, grants roles, edits the message, and DMs the applicant.

Both use the **same bot token**.

---

## 1. Create the Discord application + bot

1. Go to https://discord.com/developers/applications → **New Application**.
2. Left sidebar → **Bot** → **Reset Token** → copy it. This is `BOT_TOKEN`.
3. Still on the Bot page, no privileged intents are required — leave them off.
4. Left sidebar → **General Information** → copy the **Application ID** (used only for the invite link below).

## 2. Invite the bot with the right permissions

Use this URL, replacing `APPLICATION_ID`:

```
https://discord.com/oauth2/authorize?client_id=APPLICATION_ID&scope=bot&permissions=268520448
```

That permission set = **Manage Roles + View Channel + Send Messages + Embed Links + Read Message History**.

**Critical:** in **Server Settings → Roles**, drag the bot's own role **above** every role it will hand out (the four role IDs in `config.js`). Discord refuses to grant a role that sits above the bot.

## 3. Configure and run the bot

In `bot/config.js` set:

- `BOT_TOKEN` and `GUILD_ID` (your server ID).
- `REVIEWER_ROLE_IDS` — leave `[]` so anyone can review, or list role IDs that are allowed to press Accept/Deny.
- Confirm the `FORMS` blocks (roles + result text) are correct.

Then on your host:

```
cd bot
npm install
node index.js          # or: pm2 start index.js --name applications
```

You should see `Logged in as ...`. Keep it running 24/7 (pm2, a systemd service, or your panel's "always on" setting). If the bot is offline when someone clicks, Discord shows "interaction failed".

Tip: instead of putting secrets in `config.js`, set `BOT_TOKEN` and `GUILD_ID` as environment variables — the config reads those first.

## 4. Wire up the Apps Script

For **each** form: open it → **⋮ → Apps Script**, paste `Code.gs`, then set:

- `BOT_TOKEN` — same token.
- `CHANNEL_ID` — the channel applications should post to.
- `PING_ROLE_IDS` — one or more roles to ping, e.g. `['111','222']`.
- `FORM_KEYS` — make sure this form's exact title maps to the right key (`civstaff` / `certciv`).

Run **installTrigger** once and approve permissions. Submit a test response to confirm the card posts with working buttons.

---

## How it flows

1. Someone submits the form → Apps Script posts the card (pings, answers, two images, Accept/Deny).
2. A reviewer clicks **Accept** or **Deny** → a modal asks for a reason.
3. On submit the bot:
   - **Accept** → grants that form's two roles to the applicant, edits the card (green, buttons greyed out + disabled, "Accepted by + reason"), and DMs the acceptance message.
   - **Deny** → edits the card (red, disabled, "Denied by + reason") and DMs the denial message with the reason.

The applicant is identified by the form question whose title contains **"discord"** (configurable via `DISCORD_ID_HINT`). It must contain their numeric Discord ID.

## Adding another form later

1. In `Code.gs` `FORM_KEYS`, add `'<exact form title>': '<newkey>'`.
2. In `bot/config.js` `FORMS`, add a `<newkey>` block with its `rolesToGrant`, `acceptText`, `denyText`.
3. Paste `Code.gs` into that form and run `installTrigger`. Restart the bot.

## Notes & limits

- Custom emojis and roles only resolve inside the server that owns them.
- A reviewer with no valid Discord ID on the application: the card is still marked, but no roles/DM (you'll get an ephemeral warning).
- DMs fail silently if the applicant has DMs closed — the bot tells the reviewer so.
- The per-question "highlight the chosen option" styling from your mockup (Q6) isn't auto-generated; every answer is shown generically. That kind of formatting would need custom per-question code.
- Keep `BOT_TOKEN` private. Anyone with it controls the bot.
