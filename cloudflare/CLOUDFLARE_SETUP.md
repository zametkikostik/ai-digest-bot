# Cloudflare Workers Setup

## ✅ Внедрённые функции

### 1. RAG Поиск (Workers AI + KV)

**Команда:** `/search [запрос]` или `/rag [запрос]`

**Технологии:**
- Workers AI (`@cf/baai/bge-small-en-v1.5`) — эмбеддинги
- KV Namespace (`RAG_STORE`) — хранение чанков
- AI — генерация ответов и саммари

**Как работает:**
1. Пользователь отправляет `/search вопрос`
2. Workers AI генерирует векторный эмбеддинг запроса
3. Поиск по KV Namespace (префикс `chunk_`)
4. Возврат найденных чанков + AI-саммари

**Для загрузки документов:**
```bash
# Используйте load_knowledge.py для загрузки в KV
python3 load_knowledge.py
```

---

### 2. Планировщик постов (Cron Triggers)

**Расписание:**
- `0 9 * * *` — 09:00 UTC (утренний пост)
- `0 14 * * *` — 14:00 UTC (дневной пост)
- `30 19 * * *` — 19:30 UTC (вечерний пост)

**Типы постов:**
- 🌅 **Утро** — мотивация, советы на день
- 📊 **День** — актуальные темы, дайджесты
- 🌙 **Вечер** — итоги, разборы

**AI генерация:**
- Темы: Нейросети, AI инструменты, Промпт-инжиниринг, и т.д.
- Модель: Mistral 7B Instruct (OpenRouter)
- Длина: до 500 символов

**Логирование:**
Все посты сохраняются в D1 таблицу `posts` со статусом.

---

## 🔧 Применение схемы D1

Для обновления базы данных выполните:

```bash
# Через wrangler (требуется API токен)
export CLOUDFLARE_API_TOKEN=your_token
wrangler d1 execute ai-digest-bot-db --file=schema.sql --remote

# Или через Cloudflare Dashboard:
# 1. https://dash.cloudflare.com → Workers & Pages
# 2. ai-digest-bot → D1 → Execute SQL
# 3. Вставьте содержимое schema.sql
```

**Новые таблицы:**
- `knowledge_chunks` — чанки для RAG поиска
- Индексы для ускорения поиска

---

## 📊 Мониторинг

### Логи Worker
```bash
wrangler tail
```

### Статистика постов (D1)
```sql
SELECT status, COUNT(*) FROM posts GROUP BY status;
```

### RAG чанки (KV)
```bash
wrangler kv namespace list
wrangler kv key list --namespace-id YOUR_KV_ID --prefix chunk_
```

---

## 🚀 Деплой

Все изменения автоматически деплоятся через GitHub Actions при пуше в `main`.

**Проверка статуса:**
https://github.com/zametkikostik/ai-digest-bot/actions

**Тестирование:**
```bash
# Проверка Worker
curl https://ai-digest-bot.zametkikostik.workers.dev

# Проверка вебхука
python3 -c "
import asyncio
from aiogram import Bot
async def check():
    bot = Bot(token='YOUR_TOKEN')
    info = await bot.get_webhook_info()
    print(f'URL: {info.url}')
    await bot.session.close()
asyncio.run(check())
"
```

---

## ⚠️ Ограничения

### RAG на KV (упрощённый)
- Нет полноценного vector search (cosine similarity)
- Поиск по ключам, не по семантике
- **Рекомендация:** Использовать Cloudflare Vectorize для продакшена

### Workers AI
- Лимит: 10ms CPU time на запрос
- Модели: ограниченный набор (BGE, Mistral, Llama)
- **Рекомендация:** Кэшировать частые запросы

### Cron Triggers
- Максимум 3 триггеров на Worker
- Точность: ±5 минут
- **Рекомендация:** Логировать все выполнения

---

## 📁 Структура

```
cloudflare/
├── src/
│   └── worker.js          # Основной код бота
├── wrangler.toml          # Конфигурация
├── schema.sql             # D1 схема
├── package.json           # Зависимости
└── CLOUDFLARE_SETUP.md    # Этот файл
```

---

## 🔗 Ссылки

- [Workers AI Docs](https://developers.cloudflare.com/workers-ai/)
- [Vectorize Docs](https://developers.cloudflare.com/vectorize/)
- [D1 Docs](https://developers.cloudflare.com/d1/)
- [Cron Triggers](https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/)
