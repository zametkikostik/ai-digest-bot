#!/bin/bash
# Скрипт установки systemd сервиса для бота
# Запускать от root или через sudo

set -e

BOT_USER="${1:-$USER}"
BOT_DIR="/home/$BOT_USER/aiden bot"
SERVICE_FILE="$BOT_DIR/aiden-bot.service"
SYSTEMD_SERVICE="/etc/systemd/system/aiden-bot@$BOT_USER.service"

echo "🔧 Установка systemd сервиса для Aiden Bot..."

# Проверка существования файлов
if [ ! -f "$SERVICE_FILE" ]; then
    echo "❌ Файл сервиса не найден: $SERVICE_FILE"
    exit 1
fi

if [ ! -f "$BOT_DIR/bot.py" ]; then
    echo "❌ Файл bot.py не найден"
    exit 1
fi

if [ ! -d "$BOT_DIR/venv" ]; then
    echo "❌ Виртуальное окружение не найдено"
    exit 1
fi

# Копирование файла сервиса
echo "📋 Копирование файла сервиса..."
cp "$SERVICE_FILE" "$SYSTEMD_SERVICE"

# Создание директории для логов
echo "📁 Создание директории для логов..."
mkdir -p "$BOT_DIR/logs"

# Перезагрузка systemd
echo "🔄 Перезагрузка systemd..."
systemctl daemon-reload

# Включение сервиса
echo "▶️ Включение сервиса..."
systemctl enable "aiden-bot@$BOT_USER.service"

# Запуск сервиса
echo "🚀 Запуск сервиса..."
systemctl start "aiden-bot@$BOT_USER.service"

# Статус
echo ""
echo "✅ Сервис установлен и запущен!"
echo ""
echo "📊 Статус сервиса:"
systemctl status "aiden-bot@$BOT_USER.service" --no-pager
echo ""
echo "📋 Управление сервисом:"
echo "  systemctl status aiden-bot@$BOT_USER.service  # Статус"
echo "  systemctl stop aiden-bot@$BOT_USER.service    # Остановить"
echo "  systemctl start aiden-bot@$BOT_USER.service   # Запустить"
echo "  systemctl restart aiden-bot@$BOT_USER.service # Перезапустить"
echo "  journalctl -u aiden-bot@$BOT_USER.service -f  # Логи"
