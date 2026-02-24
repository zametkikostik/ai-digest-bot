# 🚀 Деплой Aiden Bot на Render

## Бесплатный тариф Render

Render предоставляет **750 часов бесплатно в месяц** (достаточно для 24/7 работы одного сервиса).

## 📋 Требования

- GitHub аккаунт
- Telegram Bot Token (от @BotFather)
- OpenRouter API Key (или другой AI провайдер)

## 🔧 Пошаговая инструкция

### Шаг 1: Подготовка репозитория

1. Запушьте код в GitHub:
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### Шаг 2: Создание сервиса на Render

1. Зарегистрируйтесь на [render.com](https://render.com)
2. Нажмите **New +** → **Web Service**
3. Подключите ваш GitHub репозиторий
4. Выберите репозиторий с ботом

### Шаг 3: Настройка сервиса

| Параметр | Значение |
|----------|----------|
| **Name** | `aiden-telegram-bot` |
| **Region** | Frankfurt (Germany) |
| **Branch** | `main` |
| **Root Directory** | (оставьте пустым) |
| **Runtime** | `Docker` |
| **Build Command** | (оставьте пустым) |
| **Start Command** | (оставьте пустым, используется Docker) |
| **Instance Type** | `Free` |

### Шаг 4: Переменные окружения

Добавьте следующие переменные в **Environment**:

```
BOT_TOKEN=ваш_токен_бота
BOT_NAME=Aiden - Универсальный AI-ассистент
BOT_TOPIC=Энциклопедия знаний: Школа, Вуз, AI, Инвестиции, Крипта, Бизнес, Погода, Инфляция
ADMIN_IDS=1271633868
CHANNEL_ID=-1001859702206
INVEST_CHANNEL=-1001644114424
OPENROUTER_API_KEY=ваш_openrouter_ключ
SYSTEM_PROMPT=Ты полезный AI-ассистент.
YANDEX_API_KEY=ваш_yandex_ключ (опционально)
YANDEX_FOLDER_ID=ваш_yandex_folder_id (опционально)
OPENWEATHER_API_KEY=ваш_openweather_ключ (опционально)
CHROMA_DB_PATH=./chroma_db
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
RATE_LIMIT_PER_USER=10
AUTO_LEARN_ENABLED=true
AUTO_LEARN_THRESHOLD=0.85
LOG_LEVEL=INFO
```

⚠️ **Важно:** Не добавляйте `DATABASE_URL` — бот использует SQLite.

### Шаг 5: Persistent Disk (опционально, для сохранения данных)

Для сохранения базы знаний и RAG данных:

1. Вкладка **Disks** → **Add Disk**
2. **Name:** `bot-data`
3. **Size:** `1 GB` (бесплатно до 1GB)
4. **Mount Path:** `/app/chroma_db`

### Шаг 6: Деплой

1. Нажмите **Create Web Service**
2. Дождитесь сборки и запуска (~3-5 минут)
3. Проверьте логи во вкладке **Logs**

## 📊 Мониторинг

### Проверка статуса

1. Откройте **Logs** в панели Render
2. Ищите сообщение: `Health server запущен на порту 8080`
3. Проверьте **Metrics** для просмотра использования ресурсов

### Health Check

```bash
curl https://aiden-telegram-bot.onrender.com/health
```

Ответ: `{"status": "healthy"}`

## 🔍 Решение проблем

### Бот не отвечает

1. Проверьте логи на наличие ошибок
2. Убедитесь, что `BOT_TOKEN` правильный
3. Проверьте квоты Render (750 часов/мес)

### Ошибка "Out of Memory"

Бесплатный тариф имеет ~512MB RAM. Решения:
- Уменьшите размер модели embeddings
- Отключите самообучение
- Используйте внешний векторный сервис

### Бот "засыпает"

На бесплатном тарифе сервис может засыпать после 15 минут бездействия. Для Telegram ботов это **не проблема** — бот проснётся при новом сообщении (~2-3 секунды).

## 📁 Файлы для деплоя

| Файл | Описание |
|------|----------|
| `render.yaml` | Конфигурация сервиса |
| `Dockerfile` | Docker образ |
| `.dockerignore` | Исключения для Docker |
| `.renderignore` | Исключения для Render |

## 💰 Стоимость

| Ресурс | Бесплатно | Платно |
|--------|-----------|--------|
| Hours/month | 750 | $7/мес за дополнительные |
| Bandwidth | 100 GB | $0.01/GB |
| Disk | 1 GB | $0.10/GB/мес |

**Итого:** $0/мес для базового использования

## 🔄 Обновление бота

При каждом пуше в ветку `main`:
```bash
git push origin main
```
Render автоматически пересоберёт и обновит сервис (~2-3 минуты).

## 🛑 Остановка сервиса

1. Панель Render → ваш сервис
2. **Settings** → **Suspend Service**

## 📝 Дополнительные ресурсы

- [Render Docs](https://render.com/docs)
- [Render Pricing](https://render.com/pricing)
- [Docker on Render](https://render.com/docs/deploy-docker)
