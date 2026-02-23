# 🚀 Production Deployment Guide

**Инструкция по развёртыванию AI Digest Bot в production**

---

## 📋 Чеклист перед деплоем

### 1. Безопасность
- [ ] Удалить все `.env` файлы из git
- [ ] Проверить `.gitignore`
- [ ] Создать секреты в Cloudflare/GitHub
- [ ] Проверить права доступа

### 2. Конфигурация
- [ ] Обновить `BOT_TOKEN`
- [ ] Настроить `ADMIN_IDS`
- [ ] Проверить `CHANNEL_ID`
- [ ] Добавить `OPENROUTER_API_KEY`

### 3. База данных
- [ ] Инициализировать D1
- [ ] Применить схему
- [ ] Проверить KV namespace

---

## 🌩️ Cloudflare Workers Deployment

### Шаг 1: Подготовка

```bash
cd cloudflare

# Установить зависимости
npm install

# Проверить конфигурацию
cat wrangler.toml
```

### Шаг 2: Создание ресурсов

#### KV Namespace
```bash
# RAG Store
wrangler kv namespace create "RAG_STORE"

# Conversation Store
wrangler kv namespace create "CONVERSATION_STORE"
```

Запомните ID и обновите `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "RAG_STORE"
id = "YOUR_KV_ID"
```

#### D1 Database
```bash
# Создать базу
wrangler d1 create ai-digest-bot-db

# Применить схему
wrangler d1 execute ai-digest-bot-db --file=schema.sql
```

Обновите `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "ai-digest-bot-db"
database_id = "YOUR_DATABASE_ID"
```

### Шаг 3: Настройка переменных

В Cloudflare Dashboard:
1. Workers & Pages → ai-digest-bot
2. Settings → Variables and Secrets
3. Добавить:

| Variable | Value |
|----------|-------|
| `BOT_TOKEN` | `123456:ABC-...` |
| `ADMIN_IDS` | `1271633868` |
| `CHANNEL_ID` | `-1001859702206` |
| `OPENROUTER_API_KEY` | `your_key` |

### Шаг 4: Деплой

#### Автоматически (рекомендуется)
```bash
# Просто запушьте изменения
git add .
git commit -m "feat: production ready"
git push
```

GitHub Actions автоматически задеплоит.

#### Вручную
```bash
cd cloudflare
wrangler deploy
```

### Шаг 5: Настройка вебхука

```bash
cd ..
python3 set_webhook.py
```

Или вручную:
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://ai-digest-bot.<your-subdomain>.workers.dev", "allowed_updates": ["message", "callback_query", "pre_checkout_query"]}'
```

---

## 🔍 Проверка

### 1. Проверка вебхука
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

Ожидаемый ответ:
```json
{
  "ok": true,
  "result": {
    "url": "https://...workers.dev",
    "pending_update_count": 0,
    "last_error_date": 0
  }
}
```

### 2. Тест бота
```bash
# Проверка Worker
curl https://ai-digest-bot.<subdomain>.workers.dev

# Должно вернуть: Bot OK
```

### 3. Тест команд
Отправьте боту:
- `/start` — должно появиться меню
- `/help` — список команд
- `/garden` — сад и огород

---

## 📊 Мониторинг

### Cloudflare Logs
```bash
wrangler tail
```

### Telegram Bot Stats
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getUpdates?offset=-1"
```

### Database Stats
```bash
wrangler d1 execute ai-digest-bot-db --json \
  "SELECT COUNT(*) as users FROM users"
```

---

## 🔄 Обновление

### Автоматическое
```bash
git push
# GitHub Actions сделает всё сам
```

### Ручное
```bash
cd cloudflare
wrangler deploy
```

---

## 🛡️ Безопасность

### Никогда не коммитьте:
- ❌ `.env` файлы
- ❌ Токены ботов
- ❌ API ключи
- ❌ Пароли

### Используйте:
- ✅ Cloudflare Secrets
- ✅ GitHub Secrets
- ✅ `.env.example` как шаблон

### Ротация токенов
1. Создайте новый токен в @BotFather
2. Обновите в Cloudflare Dashboard
3. Перезапустите Worker

---

## ⚠️ Troubleshooting

### Бот не отвечает
1. Проверьте вебхук: `/getWebhookInfo`
2. Проверьте логи: `wrangler tail`
3. Проверьте токен: `/getMe`

### Ошибки деплоя
```bash
# Очистить кэш
rm -rf cloudflare/.wrangler

# Проверить конфигурацию
wrangler whoami

# Деплой с логами
wrangler deploy --dry-run
```

### RAG не работает
1. Проверьте KV namespace
2. Добавьте знания: `/add тест`
3. Проверьте поиск: `/search тест`

---

## 📈 Performance

### Оптимизация
- Кэширование частых запросов
- Лимит на размер сообщений
- Rate limiting для пользователей

### Лимиты Cloudflare
- 100,000 запросов/день (бесплатно)
- 10ms CPU time
- 128MB память

---

## 🎯 Production Checklist

- [ ] Все секреты в Cloudflare
- [ ] Вебхук настроен
- [ ] База данных инициализирована
- [ ] Тесты пройдены
- [ ] Мониторинг настроен
- [ ] Документация обновлена

---

## 📞 Поддержка

При проблемах:
1. Проверьте логи
2. Проверьте статус Cloudflare
3. Проверьте лимиты Telegram

**Telegram:** @konstantin_manager_nlstar
