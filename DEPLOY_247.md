# 🚀 Развёртывание бота для работы 24/7

## Проблемы и решения

### Найденные проблемы:
1. **Webhook конфликт** - бот не мог запуститься через polling, т.к. webhook был активен
2. **Отсутствуют переменные окружения** - некоторые API ключи не были указаны

### Исправления:
1. ✅ Добавлено автоматическое удаление webhook при запуске
2. ✅ Улучшена обработка ошибок
3. ✅ OPENWEATHER_API_KEY сделан опциональным

---

## Варианты развёртывания

### Вариант 1: Docker (рекомендуется)

```bash
# 1. Убедитесь, что .env файл настроен
cp .env.example .env
# Отредактируйте .env и укажите ваши API ключи

# 2. Запуск через docker-compose
docker-compose up -d --build

# 3. Проверка логов
docker-compose logs -f bot

# 4. Остановка
docker-compose down
```

**Преимущества:**
- Полная изоляция
- Автоматический перезапуск при сбоях
- Легко переносить между серверами

---

### Вариант 2: systemd сервис (Linux)

```bash
# 1. Убедитесь, что виртуальное окружение активировано
cd "/home/$USER/aiden bot"
source venv/bin/activate

# 2. Установите зависимости
pip install -r requirements.txt

# 3. Запустите скрипт установки (от root или через sudo)
sudo bash install_systemd.sh $USER

# 4. Проверка статуса
systemctl status aiden-bot@$USER.service
```

**Управление сервисом:**
```bash
# Статус
systemctl status aiden-bot@$USER.service

# Перезапуск
systemctl restart aiden-bot@$USER.service

# Остановка
systemctl stop aiden-bot@$USER.service

# Просмотр логов
journalctl -u aiden-bot@$USER.service -f
```

**Преимущества:**
- Интеграция с системой
- Автоматический старт при загрузке
- Встроенное логирование

---

### Вариант 3: Прямой запуск (для тестирования)

```bash
cd "/home/$USER/aiden bot"
source venv/bin/activate
python bot.py
```

**Для работы в фоне используйте tmux или screen:**
```bash
# Установка tmux
sudo apt install tmux

# Запуск в tmux
tmux new -s aiden-bot
python bot.py
# Ctrl+B, D - отцепиться от сессии

# Позже: tmux attach -t aiden-bot
```

---

## Проверка работы

### 1. Проверка процесса
```bash
# Для systemd
systemctl status aiden-bot@$USER.service

# Для Docker
docker ps | grep aiden

# Для прямого запуска
ps aux | grep bot.py
```

### 2. Проверка логов
```bash
# systemd
journalctl -u aiden-bot@$USER.service -f

# Docker
docker-compose logs -f

# Файловые логи
tail -f bot.log
```

### 3. Проверка бота в Telegram
- Отправьте `/start` боту
- Проверьте ответ
- Отправьте тестовое сообщение

---

## Диагностика проблем

### Бот не запускается

```bash
# Проверка логов
journalctl -u aiden-bot@$USER.service --no-pager -n 50

# Проверка .env файла
cat .env | grep -v "="

# Проверка токена
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getMe"
```

### Ошибка "Conflict: can't use getUpdates while webhook is active"

```bash
# Удаление webhook через curl
curl "https://api.telegram.org/bot<YOUR_TOKEN>/deleteWebhook"

# Или просто перезапустите бота - webhook удалится автоматически
```

### Ошибки API ключей

```bash
# Проверка OPENROUTER_API_KEY
curl -H "Authorization: Bearer <YOUR_KEY>" https://openrouter.ai/api/v1/auth/key

# Проверка BOT_TOKEN
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getMe"
```

---

## Автоматический перезапуск при сбоях

### Docker
Docker автоматически перезапускает контейнер при падении:
```yaml
restart: unless-stopped
```

### systemd
Systemd автоматически перезапускает сервис:
```ini
Restart=always
RestartSec=10
```

---

## Мониторинг

### Проверка uptime
```bash
# systemd
systemctl show aiden-bot@$USER.service -p ActiveEnterTimestamp

# Docker
docker inspect aiden_bot --format='{{.State.StartedAt}}'
```

### Проверка памяти
```bash
# systemd
systemctl status aiden-bot@$USER.service

# Docker
docker stats aiden_bot
```

---

## Обновление бота

### Docker
```bash
git pull
docker-compose up -d --build
```

### systemd
```bash
git pull
systemctl restart aiden-bot@$USER.service
```

---

## Безопасность

1. **Не коммитьте .env файл** - он в .gitignore
2. **Используйте .env.example** как шаблон
3. **Ограничьте доступ к серверу** через SSH ключи
4. **Регулярно обновляйте зависимости**: `pip install --upgrade -r requirements.txt`
