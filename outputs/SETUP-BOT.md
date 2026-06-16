# Application system — setup

Two pieces:

- **Apps Script (`Code.gs`)** — runs on form submit and posts the application card to an **application-owned webhook**. No bot token on Google.
- **Bot (`bot/`)** — a small always-on Node app. It creates that webhook, and handles the button clicks: reason modal, role grants, editing the card, and DMing the applicant.

Why a webhook the *bot* creates? Google's servers are Cloudflare-blocked from Discord's bot API (error 40333), but webhooks go through fine. Because the bot owns the webhook, its buttons still route back to the bot over the gateway.

---

## 1. Create the Discord application + bot

1. https://discord.com/developers/applications -> **New Application**.
2. **Bot** -> **Reset Token** -> copy it. This is `BOT_TOKEN`. No privileged intents needed.
3. **General Information** -> copy the **Application ID** (for the invite link).
4. **IMPORTANT:** leave the **Interactions Endpoint URL** field **blank**. If it's set, button clicks go to HTTP instead of your gateway bot and nothing will work.

## 2. Invite the bot + fix role order

Invite (replace `APPLICATION_ID`):

```
https://discord.com/oauth2/authorize?client_id=APPLICATION_ID&scope=bot&permissions=536872960
```

That's **Manage Roles + View Channel + Send Messages + Manage Webhooks**.

In **Server Settings -> Roles**, drag the **bot's role above** the four roles it grants. Discord won't let it assign a role sitting above its own.

## 3. Configure the bot + create the webhook

In `bot/config.js` set `BOT_TOKEN`, `GUILD_ID`, and `REVIEW_CHANNEL_ID` (the channel applications post to). Then:

```
cd bot
npm install
node create-webhook.js
```

It prints three values. Put them where it says:

- `WEBHOOK_ID` and `WEBHOOK_TOKEN` -> into `bot/config.js`
- `WEBHOOK_URL` -> into `Code.gs`

Also confirm the `FORMS` blocks (roles + result text) and, if you want to gate who can review, `REVIEWER_ROLE_IDS`.

## 4. Run the bot

```
node index.js          # or: pm2 start index.js --name applications
```

You should see `Logged in as ...`. Keep it running 24/7 (pm2 / systemd / your panel's always-on). If it's offline when someone clicks, Discord shows "interaction failed".

## 5. Wire up the Apps Script

For **each** form: open it -> **â‹® -> Apps Script**, paste `Code.gs`, then set:

- `WEBHOOK_URL` — the URL from step 3.
- `PING_ROLE_IDS` — one or more roles to ping, e.g. `['111','222']`.
- `FORM_KEYS` — map this form's exact title to the right key (`civstaff` / `certciv`).

Run **installTrigger** once, approve, then submit a test response. The card should post with working buttons.

---

## How it flows

1. Form submitted -> Apps Script posts the card (pings, answers, two images, Accept/Deny).
2. A reviewer clicks **Accept** or **Deny** -> a modal asks for a reason.
3. On submit the bot:
   - **Accept** -> grants that form's two roles to the applicant, edits the card (green, buttons greyed + disabled, "Accepted by + reason"), DMs the acceptance message.
   - **Deny** -> edits the card (red, disabled, "Denied by + reason"), DMs the denial with the reason.

The applicant is identified by the form question whose title contains **"discord"** (set by `DISCORD_ID_HINT`). It must hold their numeric Discord ID.

## Adding another form later

1. `Code.gs` `FORM_KEYS`: add `'<exact form title>': '<newkey>'`.
2. `bot/config.js` `FORMS`: add a `<newkey>` block with `rolesToGrant`, `acceptText`, `denyText`.
3. Paste `Code.gs` into that form, run `installTrigger`, restart the bot.

## Notes & limits

- Custom emojis and roles only resolve inside the server that owns them.
- No valid Discord ID on an application -> the card is still marked, but no roles/DM (you get an ephemeral warning).
- DMs fail quietly if the applicant has DMs closed — the bot tells the reviewer.
- The per-question "highlight the chosen option" styling from your mockup (Q6) isn't auto-generated; answers render generically.
- Keep `BOT_TOKEN` and the webhook token private.
