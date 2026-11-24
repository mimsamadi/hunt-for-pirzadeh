#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${BOT_TOKEN:-}" || -z "${PUBLIC_BASE_URL:-}" ]]; then
  echo "Usage: BOT_TOKEN=... PUBLIC_BASE_URL=https://your-app.vercel.app [WEBHOOK_SECRET=...] $0"
  exit 1
fi

WEBHOOK_URL="${PUBLIC_BASE_URL%/}/api/webhook"
ALLOWED_UPDATES='["message","callback_query","inline_query","my_chat_member"]'

if [[ -n "${WEBHOOK_SECRET:-}" ]]; then
  curl -sS -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"${WEBHOOK_URL}\",\"secret_token\":\"${WEBHOOK_SECRET}\",\"allowed_updates\":${ALLOWED_UPDATES}}"
else
  curl -sS -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"${WEBHOOK_URL}\",\"allowed_updates\":${ALLOWED_UPDATES}}"
fi
echo ""
