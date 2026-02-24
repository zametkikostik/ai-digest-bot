#!/bin/bash
# Проверка статуса бота

cd "/home/kostik/aiden bot"

echo "📊 Статус бота"
echo "==============="

# Проверка процесса
if [ -f bot.pid ]; then
    PID=$(cat bot.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "✅ Статус: РАБОТАЕТ"
        echo "📋 PID: $PID"
        echo "🕐 Запущен: $(ps -p $PID -o lstart=)"
        echo "💾 Память: $(ps -p $PID -o rss= | awk '{printf "%.1f MB", $1/1024}')"
    else
        echo "❌ Статус: НЕ РАБОТАЕТ (PID не активен)"
    fi
else
    if pgrep -f "python bot.py" > /dev/null 2>&1; then
        PID=$(pgrep -f "python bot.py")
        echo "✅ Статус: РАБОТАЕТ (найден по имени)"
        echo "📋 PID: $PID"
    else
        echo "❌ Статус: НЕ РАБОТАЕТ"
    fi
fi

echo ""
echo "📋 Управление:"
echo "  ./start_bot.sh    — Запустить"
echo "  ./stop_bot.sh     — Остановить"
echo "  ./restart_bot.sh  — Перезапустить"
echo "  ./bot_status.sh   — Этот статус"
echo ""
echo "📊 Логи:"
echo "  tail -f logs/bot.log       — Основной лог"
echo "  tail -f logs/bot.error.log — Ошибки"
