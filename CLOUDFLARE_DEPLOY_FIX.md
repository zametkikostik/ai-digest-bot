# 🌥️ ДЕПЛОЙ НА CLOUDFLARE WORKERS

## ❌ Проблема сейчас

Бот работает **локально** (polling), но **не в Cloudflare**.

**Webhook статус:**
```json
{
    "url": "",  ← ПУСТОЙ!
    "has_custom_certificate": false
}
```

---

## 🚀 Решение: Деплой на Cloudflare

### Шаг 1: Проверка Wrangler

```bash
cd cloudflare
wrangler --version
```

Если не установлен:
```bash
npm install -g wrangler
```

### Шаг 2: Авторизация

```bash
wrangler login
```

### Шаг 3: Установка секретов

```bash
# В папке cloudflare/
wrangler secret put BOT_TOKEN
# Введите: 8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc

wrangler secret put OPENROUTER_API_KEY
# Введите: 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
```

### Шаг 4: Деплой

```bash
cd cloudflare
wrangler deploy
```

После деплоя получите URL:
```
https://ai-digest-bot.<your-subdomain>.workers.dev
```

### Шаг 5: Настройка Webhook

```bash
# Замените <YOUR_SUBDOMAIN> на ваш
curl -X POST "https://api.telegram.org/bot8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc/setWebhook" \
    -d "url=https://ai-digest-bot.<YOUR_SUBDOMAIN>.workers.dev"
```

### Шаг 6: Проверка

```bash
# Проверка webhook
curl "https://api.telegram.org/bot8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc/getWebhookInfo"
```

**Ожидаемый результат:**
```json
{
    "ok": true,
    "result": {
        "url": "https://ai-digest-bot.<subdomain>.workers.dev",
        "has_custom_certificate": false,
        "pending_update_count": 0
    }
}
```

---

## 📊 Проверка кнопок Telegram

### Отправьте боту:

1. **`/start`** — должно показать:
   ```
   👋 Привет, [Имя]!
   
   📋 Доступные команды:
   • /help
   • /ask
   • /search
   • /faq
   • /rules
   
   [📚 Категории вопросов] [❓ Помощь]
   ```

2. **`/help`** — должно показать все команды с кнопками:
   ```
   [📚 Категории] [💎 Premium]
   ```

3. **`/categories`** — кнопки категорий:
   ```
   [🎓 Образование]
   [🤖 Искусственный Интеллект]
   [💰 Инвестиции]
   [₿ Криптовалюты]
   [🏢 Бизнес]
   [🌤️ Погода]
   [📈 Инфляция]
   [🎁 Premium]
   ```

4. **`/tutor`** — AI Репетитор:
   ```
   [📐 Математика]
   [📖 Русский]
   [⚛️ Физика]
   [📝 Пробный тест]
   ```

5. **`/language`** — Языки:
   ```
   [🇬🇧 English]
   [🇧🇬 Български]
   [🇩🇪 Deutsch]
   [🇫🇷 Français]
   ```

---

## 🔧 Если кнопки не показываются

### Проблема 1: Inline клавиатуры не работают

**Проверка в логах:**
```bash
wrangler tail
```

**Решение:** Убедитесь, что `reply_markup` правильно настроен:

```javascript
const keyboard = {
    inline_keyboard: [
        [{ text: "📚 Категории", callback_data: "faq_categories" }],
        [{ text: "💎 Premium", callback_data: "premium_info" }]
    ]
};
```

### Проблема 2: Webhook не работает

**Проверка:**
```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

**Решение:**
```bash
# Удалить старый webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

# Установить новый
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
    -d "url=https://ai-digest-bot.<subdomain>.workers.dev"
```

### Проблема 3: Cloudflare не получает сообщения

**Проверка логов:**
```bash
wrangler tail --format pretty
```

**Частые ошибки:**
- ❌ Неправильный BOT_TOKEN
- ❌ Webhook URL не совпадает с Worker URL
- ❌ Worker не обрабатывает POST запросы

---

## 🧪 Тестирование

### Быстрый тест:

```bash
# Отправить тестовое сообщение боту
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
    -d "chat_id=1271633868" \
    -d "text=/start"
```

### Проверка callback query:

1. Отправьте `/start`
2. Нажмите на кнопку "📚 Категории"
3. Проверьте логи: `wrangler tail`

---

## 📁 Структура Cloudflare

```
cloudflare/
├── wrangler.toml      ← Конфигурация
├── package.json       ← Зависимости
├── schema.sql         ← D1 схема
└── src/
    └── worker.js      ← Код бота
```

---

## ⚡ Альтернатива: Оставить локальный запуск

Если Cloudflare не нужен, бот может работать локально:

```bash
# Бот уже запущен
./bot_status.sh

# Перезапуск
./restart_bot.sh
```

**Преимущества локального запуска:**
- ✅ Полный RAG с ChromaDB
- ✅ APScheduler планировщик
- ✅ Все команды работают
- ✅ Не нужно настраивать webhook

**Недостатки:**
- ❌ Нужен постоянно включённый сервер
- ❌ Нет глобального CDN
- ❌ Ограниченная масштабируемость

---

## 🎯 Выбор

| Критерий | Cloudflare | Локально |
|----------|------------|----------|
| Цена | Бесплатно (100k/день) | Бесплатно |
| RAG | Упрощённый (KV) | Полный (ChromaDB) |
| Планировщик | Cron (платно) | APScheduler ✅ |
| Сложность | Средняя | Низкая ✅ |
| Надёжность | Высокая ✅ | Зависит от сервера |

**Рекомендация:** Оставить локальный запуск для полного функционала!
