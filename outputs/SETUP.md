# Form → Discord setup

## 1. Get a Discord webhook
In Discord: **Channel → Edit Channel → Integrations → Webhooks → New Webhook**, pick the target channel, then **Copy Webhook URL**.

## 2. Add the script
Open your Google Form → top-right **⋮ menu → Apps Script**. Delete the default `Code.gs` contents and paste in all of `FormToDiscord.gs`.

## 3. Configure (top of the file)
- `WEBHOOK_URL` — paste the webhook URL from step 1.
- `ROLE_ID` — the role to ping. **This is the only thing to change to swap the pinged role.**

To get a role ID: Discord **Settings → Advanced → Developer Mode = on**, then right-click the role → **Copy Role ID**.

Optional: `PING_ROLE` (set `false` to show the tag without notifying), `HEADER_IMAGE_URL`, `TITLE_EMOJI`, `ACCENT_COLOR`, `BOT_USERNAME`/`BOT_AVATAR_URL`.

## 4. Install the trigger
In the Apps Script editor, pick **installTrigger** from the function dropdown and click **Run**. Approve the Google permissions prompt the first time. Submissions now post automatically.

## 5. Test
Run **testSend** to fire a sample card into your channel and confirm the webhook, formatting, and ping all work.

## Notes
- Questions are auto-detected — every answered question becomes its own `### Qn` block, in form order. No need to edit the code when you add/remove questions.
- For the role to actually notify, its ID must also be in `allowed_mentions` — the script handles that for you from `ROLE_ID`.
- Discord caps a message at 40 components; the script shows up to `MAX_QUESTIONS` (16) questions and notes any overflow. Raise it only if your forms are short enough to fit.
- The custom emoji/role only render correctly in the server that owns them.
