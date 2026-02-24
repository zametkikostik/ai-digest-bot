#!/bin/bash
# Деплой и настройка webhook

ACCOUNT_ID="9d3f70325c3f26a70c09c2d13b981f3c"
WORKER_NAME="ai-digest-bot"
BOT_TOKEN="8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc"

echo "🚀 Деплой Worker..."

# Читаем токен из конфига wrangler
API_TOKEN=$(grep "oauth_token" ~/.config/.wrangler/config/default.toml 2>/dev/null | cut -d'"' -f2)

if [ -z "$API_TOKEN" ]; then
    echo "❌ API токен не найден"
    exit 1
fi

echo "✅ Токен найден"

# Деплой
echo "📦 Загрузка Worker..."
RESULT=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/javascript" \
    --data-binary @src/worker.js)

echo "$RESULT" | python3 -m json.tool | head -10

if echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('success') else 1)" 2>/dev/null; then
    echo "✅ Деплой успешен!"
else
    echo "❌ Деплой не удался"
    exit 1
fi

echo ""
echo "🔗 Настройка webhook..."

WORKER_URL="https://$WORKER_NAME.$ACCOUNT_ID.workers.dev"
echo "URL: $WORKER_URL"

WEBHOOK_RESULT=$(curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
    -d "url=$WORKER_URL" \
    -d "allowed_updates=[\"message\",\"callback_query\"]")

echo "$WEBHOOK_RESULT" | python3 -m json.tool

if echo "$WEBHOOK_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('ok') else 1)" 2>/dev/null; then
    echo "✅ Webhook настроен!"
else
    echo "❌ Webhook не настроен"
    exit 1
fi

echo ""
echo "📊 Проверка webhook..."
curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo" | python3 -m json.tool

echo ""
echo "🎉 ГОТОВО! Проверьте @AidenHelpbot"
echo "Отправьте /start - должны появиться кнопки!"
