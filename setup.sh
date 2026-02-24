#!/bin/bash
# Скрипт установки и запуска бота

echo "🔧 Установка зависимостей..."
python3 -m pip install --upgrade pip || {
    echo "❌ pip не установлен. Установите его:"
    echo "   sudo apt install python3-pip"
    exit 1
}

echo "📦 Установка пакетов..."
python3 -m pip install -r requirements.txt

echo "✅ Готово!"
echo ""
echo "🚀 Для запуска бота выполните:"
echo "   python3 bot.py"
