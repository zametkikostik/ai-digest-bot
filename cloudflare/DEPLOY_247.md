# 🤖 AIDEN PRO BOT — CLOUDFLARE WORKERS 24/7

## ✅ Статус: РАБОТАЕТ

| Параметр | Значение |
|----------|----------|
| **Бот** | [@AidenHelpbot](https://t.me/AidenHelpbot) |
| **Worker URL** | `https://ai-digest-bot.aiden.workers.dev` |
| **Webhook** | ✅ Активен |
| **Режим** | 24/7 на Cloudflare |
| **Тариф** | Free (100k запросов/день) |

---

## 📋 Конфигурация (wrangler.toml)

```toml
name = "ai-digest-bot"
main = "src/worker-sw.js"
compatibility_date = "2024-01-01"
workers_dev = true

[vars]
BOT_NAME = "Aiden PRO"
BOT_TOPIC = "Школа + ВУЗ + AI + Инвестиции + Крипта + Бизнес + Погода"
ADMIN_IDS = "1271633868"
CHANNEL_ID = "-1001859702206"
INVEST_CHANNEL = "-1001644114424"
MY_TELEGRAM = "zametkikostik"

[[d1_databases]]
binding = "DB"
database_name = "ai-digest-bot-db"
database_id = "cee284b6-8392-4db8-8389-59bd9eafc869"

[[kv_namespaces]]
binding = "RAG_STORE"
id = "d7fe61b4e39b4607af339e57cee0bca1"

[[kv_namespaces]]
binding = "CONVERSATION_STORE"
id = "f3adf57a2e77412e8bb8dd38bb6394e4"

[ai]
binding = "AI"
```

---

## 🔐 Секреты (wrangler secret)

```bash
wrangler secret put BOT_TOKEN
wrangler secret put OPENROUTER_API_KEY
```

---

## 🎛️ Кнопки бота

### Главное меню:
- 🏫 **Школа** / 🎓 **ВУЗ**
- 🌿 **Сад** / 🎓 **AI Репетитор**
- 💰 **Инвест (MOEX)** / ₿ **Крипта**
- 🌤️ **Погода** / 📊 **Инфляция**
- ⚖️ **Юрист** / 🗣️ **Языки**

### Команды:
- `/start` — Главное меню
- `/help` — Справка
- `/categories` — Все категории
- `/tutor` — AI Репетитор
- `/language` — Языки
- `/lawyer` — Юрист
- `/weather [город]` — Погода
- **`/crypto`** — **Криптовалюты (CoinGecko API)** 🆕
- **`/invest`** — **Акции MOEX (Мосбиржа)** 🆕

### Котировки в реальном времени:

**Криптовалюты (CoinGecko):**
- BTC, ETH, SOL, BNB, ADA, XRP
- Цена в USD
- Изменение за 24ч 📈📉
- Кнопка "🔄 Обновить"

**Акции MOEX (Московская Биржа):**
- СБЕР, ГАЗП, ЛУКОЙЛ, ТАТН, ПОЛЮС, ЯНДЕКС
- Цена в рублях
- Изменение в % 📈📉
- Кнопка "🔄 Обновить"

---

## 🚀 Команды управления

### Деплой
```bash
cd "/home/kostik/aiden bot/cloudflare"
./node_modules/.bin/wrangler deploy
```

### Логи
```bash
./node_modules/.bin/wrangler tail
```

### Проверка статуса
```bash
./node_modules/.bin/wrangler deployments list
./node_modules/.bin/wrangler whoami
```

### Через API (быстро)
```bash
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/9d3f70325c3f26a70c09c2d13b981f3c/workers/scripts/ai-digest-bot" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/javascript" \
  --data-binary @src/worker-sw.js
```

---

## 🔍 Проверка работы

### Python скрипт
```python
import requests

BOT_TOKEN = '8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc'

# Webhook info
r = requests.get(f'https://api.telegram.org/bot{BOT_TOKEN}/getWebhookInfo')
print(r.json())

# Тест
r = requests.post(f'https://api.telegram.org/bot{BOT_TOKEN}/sendMessage',
    json={'chat_id': 1271633868, 'text': 'Test from Cloudflare!'})
print(r.json())
```

---

## 📊 Лимиты Cloudflare Free

| Ресурс | Лимит |
|--------|-------|
| Запросы/день | 100,000 |
| CPU время | 10ms/request |
| Размер скрипта | 1MB |
| KV операции | 100k/день |
| D1 операции | 5M/месяц |

---

## 🛠️ Структура проекта

```
cloudflare/
├── wrangler.toml          # Конфигурация
├── package.json           # Зависимости
├── src/
│   ├── worker-sw.js       # Service Worker (активный)
│   ├── worker-full.js     # ES Modules (резерв)
│   └── worker.js          # Старая версия
├── DEPLOY_247.md          # Этот файл
└── ...
```

---

## ⚠️ Важно

1. **Webhook уже настроен** — не нужно вызывать `setWebhook`
2. **Service Worker формат** — использует `addEventListener`, не `export default`
3. **Секреты в Cloudflare** — BOT_TOKEN и OPENROUTER_API_KEY через `wrangler secret`
4. **Бесплатный тариф** — 100k запросов/день достаточно для ~3000 пользователей

---

## 🎉 ГОТОВО!

**Бот работает 24/7 на Cloudflare Workers!**

Отправь `/start` в [@AidenHelpbot](https://t.me/AidenHelpbot) для проверки.
