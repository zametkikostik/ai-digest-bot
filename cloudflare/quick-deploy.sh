#!/bin/bash
# Быстрый деплой

ACCOUNT_ID="9d3f70325c3f26a70c09c2d13b981f3c"
WORKER_NAME="ai-digest-bot"

# Токен из конфига
API_TOKEN=$(grep "oauth_token" ~/.config/.wrangler/config/default.toml | cut -d'"' -f2)

echo "🚀 Деплой..."

RESULT=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/javascript" \
    --data-binary @src/worker.js)

if echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('success') else 1)" 2>/dev/null; then
    echo "✅ Деплой успешен!"
    echo "🔗 https://$WORKER_NAME.$ACCOUNT_ID.workers.dev"
else
    echo "❌ Ошибка: $RESULT"
fi
