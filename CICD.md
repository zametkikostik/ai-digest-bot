# CI/CD: Автоматический деплой через GitHub Actions

## 📋 Настройка

### Шаг 1: Создайте GitHub репозиторий

```bash
cd /home/kostik/aiden\ bot
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-digest-bot.git
git push -u origin main
```

### Шаг 2: Получите Cloudflare API токен

1. Зайдите в [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. **Create Token** → **Edit Cloudflare Workers**
3. Или используйте **Global API Key** (менее безопасно)

### Шаг 3: Добавьте секреты в GitHub

В репозитории на GitHub:
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Добавьте:

| Name | Value |
|------|-------|
| `CLOUDFLARE_API_TOKEN` | Ваш API токен Cloudflare |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID из Cloudflare Dashboard |
| `BOT_TOKEN` | Токен Telegram бота |
| `OPENROUTER_API_KEY` | Ключ OpenRouter |

**Где найти Account ID:**
Cloudflare Dashboard → (внизу слева)

### Шаг 4: Обновите wrangler.toml

Замените плейсхолдеры на реальные ID:

```toml
# D1 Database
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# KV Namespaces  
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Шаг 5: Деплой

Теперь при каждом `git push` в ветку `main` будет автоматический деплой:

```bash
git add .
git commit -m "Update bot"
git push
```

Проверить статус: **Actions** → **Deploy to Cloudflare Workers**

---

## 🚀 Ручной деплой (локально)

Если не хотите использовать CI/CD:

```bash
cd cloudflare

# Установка зависимостей
npm install

# Деплой
wrangler deploy
```

Или через Python (без Node.js):

```bash
# Установите wrangler через pip
pip install wrangler-cli

# Или используйте npx
npx wrangler deploy
```

---

## 📊 Логи

```bash
# В реальном времени
wrangler tail

# Фильтрация
wrangler tail --status error
```

---

## 🔄 Схема работы

```
git push → GitHub Actions → wrangler deploy → Cloudflare Workers → Telegram Webhook
```

## ⚙️ Настройка webhook после деплоя

После первого деплоя настройте webhook:

```python
import requests

BOT_TOKEN = "8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc"
WORKER_URL = "https://ai-digest-bot.YOUR_SUBDOMAIN.workers.dev"

response = requests.post(
    f"https://api.telegram.org/bot{BOT_TOKEN}/setWebhook",
    json={"url": WORKER_URL}
)
print(response.json())
# {"ok": true, "result": true, "description": "Webhook was set"}
```

---

## 📁 Структура для git

```
/home/kostik/aiden bot/
├── .github/
│   └── workflows/
│       └── deploy.yml    # CI/CD
├── cloudflare/
│   ├── src/
│   │   └── worker.js
│   ├── wrangler.toml
│   ├── schema.sql
│   └── package.json
├── bot.py                # Python версия (локально)
├── config.py
└── .env                  # НЕ коммитьте в git!
```

## ⚠️ .gitignore

Убедитесь, что `.env` не попадает в git:

```bash
# .gitignore в корне
.env
*.db
chroma_db/
__pycache__/
*.pyc
bot.log

# cloudflare/.gitignore
node_modules/
.wrangler/
.dev.vars
```
