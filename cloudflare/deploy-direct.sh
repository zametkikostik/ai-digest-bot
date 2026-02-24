#!/bin/bash
# Прямой деплой через Cloudflare API

ACCOUNT_ID="9d3f70325c3f26a70c09c2d13b981f3c"
WORKER_NAME="ai-digest-bot"
WORKER_FILE="src/worker.js"

echo "🚀 Прямой деплой через API..."

# Читаем токен из wrangler
CLOUDFLARE_API_TOKEN=$(grep -r "api_token" ~/.config/.wrangler/ 2>/dev/null | head -1 | cut -d'"' -f4)

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ Не найден API токен"
    exit 1
fi

# Деплой
echo "📦 Загрузка Worker..."
curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/javascript" \
    --data-binary @"$WORKER_FILE" \
    -F "metadata={\"main_module\":\"worker.js\",\"bindings\":[{\"name\":\"BOT_TOKEN\",\"type\":\"secret_text\"},{\"name\":\"OPENROUTER_API_KEY\",\"type\":\"secret_text\"}]}"

echo ""
echo "✅ Деплой завершён!"
