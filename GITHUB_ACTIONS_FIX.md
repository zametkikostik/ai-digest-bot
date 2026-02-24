# 🔧 GITHUB ACTIONS — ДИАГНОСТИКА И ИСПРАВЛЕНИЯ

**Дата:** 24 февраля 2026 г.  
**Статус:** ✅ WORKFLOW ОБНОВЛЁН

---

## ✅ ЧТО ИСПРАВЛЕНО

### Обновлён `.github/workflows/deploy.yml`

**Добавлено:**

1. **workflow_dispatch** — ручной запуск
```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:  # ✅ Кнопка "Run workflow"
```

2. **Кэш npm** — ускорение сборок
```yaml
cache: 'npm'
cache-dependency-path: cloudflare/package-lock.json
```

3. **Проверка wrangler**
```yaml
- name: Verify Wrangler
  run: wrangler --version
```

4. **Проверка файлов**
```yaml
if [ ! -f "wrangler.toml" ]; then
  echo "❌ wrangler.toml not found!"
  exit 1
fi
```

5. **Красивые логи**
```bash
echo "🚀 Deploying to Cloudflare Workers..."
echo "✅ Deployment completed successfully!"
```

6. **Summary с результатами**
```yaml
- name: Deployment Summary
  if: always()
  run: |
    echo "## Deployment Summary" >> $GITHUB_STEP_SUMMARY
```

---

## 🔍 ПРОВЕРКА СТАТУСА

### 1. GitHub Actions

**Открой:**
```
https://github.com/zametkikostik/ai-digest-bot/actions
```

**Что видеть:**
```
✅ Deploy to Cloudflare Workers — Success (зелёный)
⏳ Deploy to Cloudflare Workers — Running (жёлтый)
❌ Deploy to Cloudflare Workers — Failed (красный)
```

### 2. Детали запуска

**Кликни на последний запуск:**
```
#63 Deploy to Cloudflare Workers
```

**Разверни шаги:**
```
✅ Checkout
✅ Setup Node.js
✅ Install dependencies
✅ Install Wrangler
✅ Verify Wrangler
✅ Deploy to Cloudflare Workers
✅ Deployment Summary
```

### 3. Если видишь ошибку

**Частые проблемы:**

#### ❌ "Secrets not found"

**Ошибка:**
```
Error: CLOUDFLARE_API_TOKEN is not found
```

**Решение:**
1. GitHub → Repository → Settings → Secrets → Actions
2. New repository secret
3. Name: `CLOUDFLARE_API_TOKEN`
4. Value: твой токен из Cloudflare
5. Повтори для `CLOUDFLARE_ACCOUNT_ID`

#### ❌ "wrangler.toml not found"

**Ошибка:**
```
❌ wrangler.toml not found!
```

**Решение:**
```bash
cd cloudflare
ls -la wrangler.toml
# Если нет — проверь путь
```

#### ❌ "npm install failed"

**Ошибка:**
```
npm ERR! code ENOENT
```

**Решение:**
```bash
cd cloudflare
npm install
# Проверь package.json
```

#### ❌ "Deploy failed"

**Ошибка:**
```
✘ [ERROR] Cloudflare API error
```

**Решение:**
- Проверь токен в Cloudflare
- Проверь права токена (Edit Workers)
- Пересоздай токен

---

## 🚀 РУЧНОЙ ЗАПУСК

Если авто-деплой не сработал:

### 1. Через GitHub UI

```
1. https://github.com/zametkikostik/ai-digest-bot/actions
2. Выбери "Deploy to Cloudflare Workers"
3. Кнопка "Run workflow" (справа)
4. Выбери ветку: main
5. Кнопка "Run workflow"
```

### 2. Через GitHub CLI

```bash
# Установи gh
gh workflow run deploy.yml
```

### 3. Локально (wrangler)

```bash
cd cloudflare
wrangler deploy
```

---

## 📊 МОНИТОРИНГ

### В реальном времени

**GitHub Actions:**
```
https://github.com/zametkikostik/ai-digest-bot/actions
```

**Cloudflare:**
```
wrangler tail
```

### После деплоя

**Проверь Worker:**
```
https://dash.cloudflare.com → Workers → ai-digest-bot
```

**Проверь версию:**
```
Last deployed: сейчас
Version: обновлена
```

---

## ✅ ЧЕК-ЛИСТ ПРОВЕРКИ

### Перед деплоем

- [ ] Изменения в cloudflare/
- [ ] wrangler.toml на месте
- [ ] src/worker.js существует
- [ ] package.json корректный

### Во время деплоя

- [ ] GitHub Actions запустился
- [ ] Все шаги зелёные
- [ ] Нет ошибок в логах
- [ ] Deployment Summary показывает успех

### После деплоя

- [ ] Cloudflare Worker обновился
- [ ] KV Namespace работают
- [ ] D1 Database подключена
- [ ] Cron triggers активны

---

## 🆘 ЕСЛИ ВСЁ КРАСНОЕ

### Шаг 1: Проверь Secrets

```
GitHub → Settings → Secrets → Actions

Должны быть:
✅ CLOUDFLARE_API_TOKEN
✅ CLOUDFLARE_ACCOUNT_ID
```

### Шаг 2: Проверь токены

**Cloudflare:**
```
https://dash.cloudflare.com/profile/api-tokens

Токен должен иметь права:
✅ Edit Cloudflare Workers
✅ Edit Workers KV Storage
✅ Edit D1
```

### Шаг 3: Пересоздай токены

```bash
# Cloudflare Dashboard → API Tokens
# Create Token → Edit Cloudflare Workers
# Скопируй новый токен
# GitHub → Settings → Secrets → Обновить
```

### Шаг 4: Тестовый деплой

```bash
cd cloudflare
wrangler login
wrangler deploy
```

Если работает локально — проблема в GitHub Secrets.

### Шаг 5: Проверь логи

**GitHub:**
```
Actions → Последний запуск → Logs
```

**Ищи:**
```
❌ Error:
⚠️ Warning:
✘ [ERROR]
```

---

## 📊 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ

### Успешный деплой

```
✅ Deploy to Cloudflare Workers
   ✅ Checkout (2s)
   ✅ Setup Node.js (3s)
   ✅ Install dependencies (15s)
   ✅ Install Wrangler (5s)
   ✅ Verify Wrangler (1s)
   ✅ Deploy to Cloudflare Workers (10s)
   ✅ Deployment Summary (1s)
```

**Время:** ~30 секунд  
**Статус:** ✅ Success (зелёный)

### После деплоя

**Cloudflare Dashboard:**
```
ai-digest-bot
Last deployed: 1 minute ago
Status: Active ✅
```

---

## 🎯 ИТОГИ

**Workflow обновлён:**
```
✅ .github/workflows/deploy.yml
✅ Добавлен кэш npm
✅ Добавлен workflow_dispatch
✅ Проверка файлов
✅ Красивые логи
✅ Summary
```

**Для проверки:**
```
1. https://github.com/zametkikostik/ai-digest-bot/actions
2. Все запуски должны быть зелёными ✅
3. Если красные — смотри логи
4. Исправь ошибку по инструкции выше
```

**Следующий деплой:**
```
git push origin main
# Автоматически задеплоится!
```

---

*Workflow оптимизирован и готов к работе!*  
*Всё должно гореть зелёным!* ✅

*Aiden Bot 3.0*
