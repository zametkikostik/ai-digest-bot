#!/bin/bash
# Деплой бота на Cloudflare Workers

set -e

cd "/home/kostik/aiden bot/cloudflare"

echo "🚀 Деплой на Cloudflare Workers..."

# Проверка Wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler не установлен. Установка..."
    npm install -g wrangler
fi

# Авторизация
echo ""
echo "📱 Авторизация в Cloudflare..."
wrangler login

# Установка секретов
echo ""
echo "🔐 Установка секретов..."

echo "Введите BOT_TOKEN:"
wrangler secret put BOT_TOKEN

echo "Введите OPENROUTER_API_KEY:"
wrangler secret put OPENROUTER_API_KEY

# Деплой
echo ""
echo "📦 Деплой..."
wrangler deploy

echo ""
echo "✅ Деплой завершён!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Скопируйте URL Worker из вывода выше"
echo "2. Установите webhook:"
echo ""
echo "curl -X POST 'https://api.telegram.org/bot8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc/setWebhook' \\"
echo "    -d 'url=https://YOUR-WORKER-URL.workers.dev'"
echo ""
echo "3. Проверьте:"
echo "curl 'https://api.telegram.org/bot8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc/getWebhookInfo'"
