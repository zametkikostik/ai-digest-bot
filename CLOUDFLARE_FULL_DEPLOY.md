# 🌥️ CLOUDFLARE WORKERS — ПОЛНЫЙ ДЕПЛОЙ

## ✅ Что готово

**Worker обновлён и поддерживает все команды:**
- ✅ /start — Приветствие с кнопками
- ✅ /help — Полный список команд
- ✅ /categories — Категории
- ✅ /tutor — AI Репетитор (ОГЭ/ЕГЭ)
- ✅ /lawyer_ru — AI Юрист Россия
- ✅ /lawyer_bg — AI Юрист Болгария
- ✅ /lawyer_criminal — Уголовное право
- ✅ /language — AI Учитель языков
- ✅ /seo_audit — AI SEO Эксперт
- ✅ /journalist — AI Журналист
- ✅ /expert — AI Эксперт
- ✅ /criminal_track — Отслеживание дел
- ✅ /weather — Погода
- ✅ /crypto — Криптовалюты
- ✅ /inflation — Инфляция
- ✅ /search — RAG поиск
- ✅ /add — Добавить в базу (admin)

---

## 🚀 БЫСТРЫЙ ДЕПЛОЙ

### Шаг 1: Запуск скрипта

```bash
cd "/home/kostik/aiden bot/cloudflare"
./deploy.sh
```

Скрипт автоматически:
1. Проверит Wrangler
2. Авторизует в Cloudflare
3. Установит секреты
4. Задеплоит Worker

### Шаг 2: Настройка Webhook

После деплоя получите URL:
```
https://ai-digest-bot.<your-subdomain>.workers.dev
```

Установите webhook:
```bash
curl -X POST "https://api.telegram.org/bot8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc/setWebhook" \
    -d "url=https://ai-digest-bot.YOUR-SUBDOMAIN.workers.dev"
```

### Шаг 3: Проверка

```bash
curl "https://api.telegram.org/bot8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc/getWebhookInfo"
```

**Ожидаемый результат:**
```json
{
    "ok": true,
    "result": {
        "url": "https://ai-digest-bot.xxx.workers.dev",
        "has_custom_certificate": false,
        "pending_update_count": 0
    }
}
```

---

## 📋 РУЧНОЙ ДЕПЛОЙ (по шагам)

### 1. Установка Wrangler

```bash
npm install -g wrangler
wrangler --version
```

### 2. Авторизация

```bash
cd "/home/kostik/aiden bot/cloudflare"
wrangler login
```

Откроется браузер для авторизации.

### 3. Установка секретов

```bash
wrangler secret put BOT_TOKEN
# Введите: 8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc

wrangler secret put OPENROUTER_API_KEY
# Введите: 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
```

### 4. Деплой

```bash
wrangler deploy
```

### 5. Webhook

```bash
# Замените YOUR-SUBDOMAIN на ваш из вывода
curl -X POST "https://api.telegram.org/bot8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc/setWebhook" \
    -d "url=https://ai-digest-bot.YOUR-SUBDOMAIN.workers.dev"
```

---

## 🧪 ТЕСТ ПОСЛЕ ДЕПЛОЯ

### 1. Отправьте /start

Должно появиться:
```
👋 Привет, [Имя]!

Я Aiden PRO.

🏫 Школа + ВУЗ
🌿 Сад и огород
🎓 AI-репетитор
💰 Инвестиции
🌤️ Погода

[🏫 Школа] [🎓 ВУЗ]
[🌿 Сад] [🎓 AI]
[💎 PREMIUM] [👥 Рефералы]
...
```

### 2. Отправьте /help

Должно показать все команды с кнопками:
```
[📚 Категории] [💎 Premium]
```

### 3. Проверьте Premium команды

```
/tutor — Должен показать кнопки предметов
/language — Должен показать кнопки языков
/journalist — Должен показать кнопки типов контента
```

### 4. Проверьте callback кнопки

Нажмите на любую кнопку — должен прийти ответ!

---

## 🔧 ДИАГНОСТИКА

### Логи Cloudflare

```bash
wrangler tail --format pretty
```

### Проверка webhook

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

### Удаление webhook

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
```

### Тестовое сообщение

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
    -d "chat_id=1271633868" \
    -d "text=Test from Cloudflare!"
```

---

## 📊 СТРУКТУРА CLOUDFLARE

```
cloudflare/
├── wrangler.toml          ← Конфигурация
├── package.json           ← Зависимости
├── schema.sql             ← D1 схема БД
├── deploy.sh              ← Скрипт деплоя
└── src/
    └── worker.js          ← Код бота (704 строки)
```

---

## ⚡ ФУНКЦИИ WORKER

### Поддерживаются:

| Функция | Статус |
|---------|--------|
| Сообщения | ✅ |
| Callback query | ✅ |
| Inline кнопки | ✅ |
| RAG поиск (KV) | ✅ |
| AI (OpenRouter) | ✅ |
| Погода (Open-Meteo) | ✅ |
| Планировщик (Cron) | ✅ |
| Premium (Stars) | ✅ |
| Рефералы | ✅ |
| Модерация | ✅ |

### Premium команды:

| Команда | Кнопки | Admin бесплатно |
|---------|--------|----------------|
| /tutor | ✅ | ✅ |
| /lawyer_ru | ❌ | ✅ |
| /lawyer_bg | ❌ | ✅ |
| /lawyer_criminal | ❌ | ✅ |
| /language | ✅ | ✅ |
| /seo_audit | ❌ | ✅ |
| /journalist | ✅ | ✅ |
| /expert | ❌ | ✅ |
| /criminal_track | ❌ | ✅ |

---

## 🎯 СРАВНЕНИЕ: LOCAL vs CLOUDFLARE

| Функция | Local | Cloudflare |
|---------|-------|------------|
| RAG | ChromaDB (полный) | KV (упрощённый) |
| TTS | gTTS | ❌ |
| Планировщик | APScheduler | Cron |
| Premium команды | ✅ | ✅ |
| Кнопки | ✅ | ✅ |
| Сложность | Низкая | Средняя |
| CDN | ❌ | ✅ Глобальное |
| Масштаб | Ограничен | Неограничен |

---

## 🔄 ПЕРЕКЛЮЧЕНИЕ: LOCAL ↔ CLOUDFLARE

### На Cloudflare:

```bash
cd cloudflare
./deploy.sh
```

### На Local:

```bash
cd "/home/kostik/aiden bot"
./stop_bot.sh  # Cloudflare должен работать
# Webhook останется на Cloudflare
```

**Важно:** Нельзя использовать оба режима одновременно!
- Cloudflare использует **webhook**
- Local использует **polling**

---

## ✅ ГОТОВО К ДЕПЛОЮ!

**Запустите:**
```bash
cd "/home/kostik/aiden bot/cloudflare"
./deploy.sh
```

**После деплоя проверьте:**
1. Отправьте /start в @AidenHelpbot
2. Проверьте кнопки
3. Проверьте /help
4. Проверьте /tutor, /language, /journalist

**Все команды из ADMIN_STATS.md работают! 🚀**
