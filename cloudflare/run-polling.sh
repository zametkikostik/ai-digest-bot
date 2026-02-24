#!/bin/bash
# Запуск бота через long polling на Cloudflare

echo "⚠️ Cloudflare webhook не работает (Telegram блокирует IP)"
echo ""
echo "✅ РЕШЕНИЕ: Используем локальный бот"
echo ""
echo "Запуск локального бота..."
cd "/home/kostik/aiden bot"
./start_bot.sh
sleep 3
./bot_status.sh

echo ""
echo "📱 Проверьте @AidenHelpbot"
echo "Отправьте /start - должны появиться кнопки!"
