#!/bin/bash
# Скрипт запуска бота в фоне
# Использование: ./start_bot.sh

cd "/home/kostik/aiden bot"

# Проверка, запущен ли уже бот
if [ -f bot.pid ]; then
    PID=$(cat bot.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "⚠️ Бот уже запущен (PID: $PID)"
        echo "🛑 Остановка: ./stop_bot.sh"
        exit 0
    fi
fi

# Проверка venv
if [ ! -f venv/bin/activate ]; then
    PYTHON_CMD=python3
else
    source venv/bin/activate
    PYTHON_CMD=python
fi

# Запуск в фоне с логированием
nohup $PYTHON_CMD bot.py >> logs/bot.log 2>> logs/bot.error.log &

# Сохранение PID
echo $! > bot.pid

echo "✅ Бот запущен в фоне (PID: $(cat bot.pid))"
echo "📋 Логи: tail -f logs/bot.log"
echo "🛑 Остановка: ./stop_bot.sh"
