# Contact handler

Takes the statement typed on the site's typewriter and forwards it to your Telegram. It runs as a Cloudflare Worker on the free plan, so the site itself can stay a static page on GitHub Pages: the bot token lives in the Worker as a secret and never reaches the browser.

Each address may file 3 statements a minute (Cloudflare's rate limiting binding, counted per Cloudflare location). Requests are capped at 8 KB, fields are validated with the same rules as the form (`src/contact/statement.ts`), and a hidden `website` field quietly drops bots. Only the origin in `ALLOWED_ORIGIN` may post from a browser.

## 1. Telegram bot

1. In Telegram, open [@BotFather](https://t.me/BotFather), send `/newbot`, pick a name and a username ending in `bot`. BotFather answers with the token, `123456789:AA...`.
2. Open your new bot and press **Start**, so it is allowed to write to you.
3. Open `https://api.telegram.org/bot<token>/getUpdates` in a browser. Your chat id is `result[0].message.chat.id`, a number like `123456789`.

## 2. Deploy the Worker

You need a free Cloudflare account. The first time you open **Workers & Pages** in the dashboard, Cloudflare asks you to pick a `workers.dev` subdomain.

```bash
npm install
npx wrangler login                     # opens the browser once
npm run contact:deploy                 # prints https://case404-contact.<subdomain>.workers.dev
npx wrangler secret put TELEGRAM_BOT_TOKEN --config server/contact/wrangler.jsonc
npx wrangler secret put TELEGRAM_CHAT_ID --config server/contact/wrangler.jsonc
```

Each `secret put` asks for the value and redeploys the Worker. `ALLOWED_ORIGIN` is set in `wrangler.jsonc`; change it there if the site moves to another address.

Check it from the terminal; the message should arrive in Telegram and the command should print `204`:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://case404-contact.<subdomain>.workers.dev/contact \
  -H "content-type: application/json" \
  -d '{"contact":"@me","message":"Проверка связи","locale":"ru"}'
```

## 3. Point the site at it

Set the endpoint, with the `/contact` path, as the `CONTACT_ENDPOINT` repository variable on GitHub (see the main README). For a local build, put it in `.env.local` as `NEXT_PUBLIC_CONTACT_ENDPOINT`; a browser on `localhost` is turned away by `ALLOWED_ORIGIN`, so test locally with `curl` or `npm run contact:dev`.

## Local development

```bash
printf 'TELEGRAM_BOT_TOKEN="123:abc"\nTELEGRAM_CHAT_ID="123456789"\n' > server/contact/.dev.vars
npm run contact:dev                    # http://localhost:8787/contact
```

`.dev.vars` is ignored by git. Logs of the deployed Worker are in the dashboard under **Workers & Pages → case404-contact → Logs**.
