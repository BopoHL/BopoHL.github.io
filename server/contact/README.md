# Contact handler

Takes the statement typed on the site's typewriter and forwards it to your Telegram. It is a single Node process with no dependencies, meant to sit behind the nginx that already serves the static site.

## Run

Node 22.18 or newer runs the TypeScript sources directly.

```bash
TELEGRAM_BOT_TOKEN=123:abc TELEGRAM_CHAT_ID=123456789 npm run contact:serve
```

| Variable | Default | Meaning |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | required | Token of the bot that writes to you, from @BotFather |
| `TELEGRAM_CHAT_ID` | required | Your chat id with that bot (send the bot a message, then read `getUpdates`) |
| `ALLOWED_ORIGIN` | `*` | Origin allowed to post, e.g. `https://case404.example` |
| `HOST` / `PORT` | `127.0.0.1` / `8787` | Where the handler listens |

Each address may file 3 statements per 10 minutes. Requests are capped at 8 KB, fields are validated with the same rules as the form (`src/contact/statement.ts`), and a hidden `website` field quietly drops bots.

## Wire it to the site

Build the site with the endpoint, so the form posts instead of falling back to Telegram:

```bash
NEXT_PUBLIC_CONTACT_ENDPOINT=/api/contact npm run build
```

nginx, inside the site's `server` block:

```nginx
location = /api/contact {
    proxy_pass http://127.0.0.1:8787/contact;
    proxy_set_header X-Real-IP $remote_addr;
    client_max_body_size 8k;
}
```

systemd unit, e.g. `/etc/systemd/system/case404-contact.service`:

```ini
[Unit]
Description=Case 404 contact handler
After=network.target

[Service]
WorkingDirectory=/srv/case404
ExecStart=/usr/bin/node server/contact/main.ts
Environment=TELEGRAM_BOT_TOKEN=123:abc
Environment=TELEGRAM_CHAT_ID=123456789
Environment=ALLOWED_ORIGIN=https://case404.example
Restart=on-failure
User=www-data

[Install]
WantedBy=multi-user.target
```
