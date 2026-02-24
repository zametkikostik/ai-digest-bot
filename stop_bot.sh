#!/bin/bash
# Скрипт остановки бота

cd "/home/kostik/aiden bot"

if [ -f bot.pid ]; then
    PID=$(cat bot.pid)
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        echo "✅ Бот остановлен (PID: $PID)"
    else
        echo "⚠️ Процесс не найден"
    fi
    rm bot.pid
else
    # Поиск по имени процесса
    pkill -f "python bot.py"
    echo "✅ Бот остановлен"
fi
