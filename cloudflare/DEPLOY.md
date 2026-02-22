# Деплой бота на Cloudflare Workers

## 📋 Требования

1. Аккаунт Cloudflare (бесплатный подходит)
2. Установленный Node.js 18+
3. Wrangler CLI

## 🚀 Пошаговая инструкция

### Шаг 1: Установка Wrangler

```bash
npm install -g wrangler
# или
npx wrangler --version
```

### Шаг 2: Авторизация

```bash
wrangler login
```

Откроется браузер для авторизации через Cloudflare.

### Шаг 3: Создание D1 базы данных

```bash
wrangler d1 create ai-digest-bot-db
```

Запомните `database_id` из вывода.

### Шаг 4: Инициализация БД

Откройте `wrangler.toml` и замените `YOUR_DATABASE_ID` на реальный ID:

```toml
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Затем создайте таблицы:

```bash
wrangler d1 execute ai-digest-bot-db --file=schema.sql
```

### Шаг 5: Создание KV хранилищ

```bash
# Для RAG
wrangler kv namespace create "RAG_STORE"

# Для контекста диалогов
wrangler kv namespace create "CONVERSATION_STORE"
```

Запомните ID из вывода и обновите `wrangler.toml`.

### Шаг 6: Настройка секретов

```bash
wrangler secret put BOT_TOKEN
# Введите токен бота

wrangler secret put OPENROUTER_API_KEY
# Введите ключ OpenRouter
```

### Шаг 7: Обновление wrangler.toml

Отредактируйте `wrangler.toml`:
- Замените `YOUR_DATABASE_ID` на ID D1 базы
- Замените `YOUR_KV_ID` на ID RAG_STORE
- Замените `YOUR_CONVERSATION_KV_ID` на ID CONVERSATION_STORE
- Укажите ваш `CHANNEL_ID`

### Шаг 8: Деплой

```bash
wrangler deploy
```

После деплоя вы получите URL воркера, например:
`https://ai-digest-bot.your-subdomain.workers.dev`

### Шаг 9: Настройка webhook Telegram

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://ai-digest-bot.your-subdomain.workers.dev"
```

Или через Python:

```python
import requests

BOT_TOKEN = "your_token"
WEBHOOK_URL = "https://ai-digest-bot.your-subdomain.workers.dev"

response = requests.post(
    f"https://api.telegram.org/bot{BOT_TOKEN}/setWebhook",
    json={"url": WEBHOOK_URL}
)
print(response.json())
```

### Шаг 10: Проверка

```bash
# Просмотр логов
wrangler tail

# Health check
curl https://ai-digest-bot.your-subdomain.workers.dev
```

## 📊 Тарифы Cloudflare

| План | Цена | Лимиты |
|------|------|--------|
| Free | $0 | 100k запросов/день, 10ms CPU |
| Pro | $20 | Неограниченно, 10min выполнения |
| Workers Paid | $5 | 100k запросов/месяц |

## ⚠️ Ограничения

1. **RAG на KV** — упрощённая версия без векторного поиска. Для полноценного RAG используйте:
   - Cloudflare Workers AI (с эмбеддингами)
   - Внешний векторный сервис (qdrant, pinecone)

2. **Планировщик** — CRON работает только на платных тарифах

3. **Хранение файлов** — для загрузки документов используйте Cloudflare R2

## 🔧 Команды

```bash
# Локальная разработка
wrangler dev

# Деплой
wrangler deploy

# Просмотр логов
wrangler tail

# Локальная БД
wrangler d1 execute ai-digest-bot-db --local --file=schema.sql

# Очистка KV
wrangler kv namespace purge --binding RAG_STORE
```

## 📁 Структура

```
cloudflare/
├── wrangler.toml      # Конфигурация
├── package.json       # Зависимости
├── schema.sql         # Схема БД
└── src/
    └── worker.js      # Код воркера
```

## 🔄 Миграция с Python версии

1. Экспортируйте базу знаний из ChromaDB
2. Импортируйте чанки в KV хранилище
3. Настройте webhook на новый URL
4. Протестируйте команды
