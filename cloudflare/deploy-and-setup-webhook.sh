#!/bin/bash
# Автоматический деплой и настройка webhook

set -e

BOT_TOKEN="8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc"
WORKER_NAME="ai-digest-bot"

echo "🚀 Cloudflare Deploy + Webhook Setup"
echo "======================================"
echo ""

# Деплой
echo "📦 Деплой Worker..."
cd "/home/kostik/aiden bot/cloudflare"

# Пробуем деплой с таймаутом
if timeout 120 wrangler deploy 2>&1; then
    echo "✅ Деплой успешен!"
else
    echo "❌ Деплой не удался (таймаут или ошибка сети)"
    echo ""
    echo "Попробуйте вручную:"
    echo "  cd cloudflare && wrangler deploy"
    exit 1
fi

# Получаем URL Worker
echo ""
echo "📡 Получение URL Worker..."
WORKER_URL=$(wrangler whoami --json 2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
# Получаем последний деплой
import subprocess
result = subprocess.run(['wrangler', 'deployments', 'list', '--json'], capture_output=True, text=True)
print('OK')
" 2>/dev/null || echo "")

# Альтернативно - берём из wrangler.toml
if [ -z "$WORKER_URL" ]; then
    ACCOUNT_ID=$(grep -A1 "Account ID" <<< "$(wrangler whoami)" | tail -1 | awk '{print $NF}')
    WORKER_URL="https://$WORKER_NAME.$(echo $ACCOUNT_ID | cut -c1-8).workers.dev"
fi

echo "Worker URL: $WORKER_URL"

# Настройка webhook
echo ""
echo "🔗 Настройка Telegram Webhook..."
WEBHOOK_RESULT=$(curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
    -d "url=$WORKER_URL" \
    -d "allowed_updates=[\"message\",\"callback_query\"]")

if echo "$WEBHOOK_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('ok') else 1)" 2>/dev/null; then
    echo "✅ Webhook настроен!"
else
    echo "❌ Ошибка настройки webhook: $WEBHOOK_RESULT"
    exit 1
fi

# Проверка
echo ""
echo "✅ Проверка..."
curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo" | python3 -m json.tool

echo ""
echo "🎉 ГОТОВО!"
echo ""
echo "Проверьте бота @AidenHelpbot:"
echo "  1. Отправьте /start"
echo "  2. Должны появиться кнопки"
echo ""
echo "Все команды доступны:"
echo "  /start, /help, /categories, /tutor, /language, /lawyer_ru, /lawyer_bg, etc."
