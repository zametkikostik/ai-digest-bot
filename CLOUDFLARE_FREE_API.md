# 🔄 МИГРАЦИЯ НА БЕСПЛАТНЫЕ API + CLOUDFLARE

## ✅ Что изменено

### 1. Погода (OpenWeather)
**Было:** Требуется API ключ
**Стало:** Работает без ключа (дефолтные данные)

```python
# Раньше
real_time_data = RealTimeData(config.OPENWEATHER_API_KEY)

# Теперь
real_time_data = RealTimeData(None)  # Без ключа!
```

### 2. TTS (Голос)
**Было:** Yandex SpeechKit (требует API ключ)
**Стало:** gTTS (бесплатно, без ключей)

```python
# Используется core/free_tts.py
from core.free_tts import send_voice_message

await send_voice_message(bot, chat_id, text, lang="ru")
```

### 3. AI Модели
**Все модели теперь бесплатные через OpenRouter:**
- `qwen/qwen3-235b-a22b:free`
- `deepseek/deepseek-r1:free`
- `mistralai/mistral-7b-instruct:free`
- `google/gemma-3-27b-it:free`

---

## 🚀 Работа через Cloudflare Workers

### Вариант 1: Cloudflare Workers (рекомендуется для продакшена)

**Преимущества:**
- ✅ Бесплатно до 100k запросов/день
- ✅ Автоматическое масштабирование
- ✅ Глобальная сеть CDN
- ✅ Не нужен свой сервер

**Настройка:**

```bash
# 1. Перейти в папку Cloudflare
cd cloudflare

# 2. Установить Wrangler
npm install -g wrangler

# 3. Войти в Cloudflare
wrangler login

# 4. Установить секреты
wrangler secret put BOT_TOKEN
wrangler secret put OPENROUTER_API_KEY

# 5. Задеплоить
wrangler deploy
```

**После деплоя:**
```bash
# Настроить webhook
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://ai-digest-bot.<your-subdomain>.workers.dev"
```

### Вариант 2: Локальный запуск (для тестирования)

**Преимущества:**
- ✅ Быстрая разработка
- ✅ Полный доступ к ФС
- ✅ RAG с ChromaDB

**Запуск:**
```bash
./start_bot.sh
./bot_status.sh
```

---

## 📊 Сравнение вариантов

| Функция | Cloudflare Workers | Локально |
|---------|-------------------|----------|
| Цена | Бесплатно (100k/день) | Бесплатно |
| RAG | Упрощённый (KV) | Полный (ChromaDB) |
| TTS | gTTS | gTTS |
| Погода | ✅ | ✅ |
| Котировки | ✅ | ✅ |
| Планировщик | Cron (платно) | APScheduler |
| Сложность | Средняя | Низкая |

---

## 🔧 Обновление .env

```bash
# Все API теперь бесплатные!
# Не нужно указывать:
# - OPENWEATHER_API_KEY
# - YANDEX_API_KEY
# - YANDEX_FOLDER_ID

# Достаточно:
BOT_TOKEN=your_token
OPENROUTER_API_KEY=your_key  # бесплатные модели
```

---

## 📈 Доступные функции

### Бесплатно (все пользователи):
- ✅ AI ответы (бесплатные модели)
- ✅ RAG поиск
- ✅ Погода (дефолтные данные)
- ✅ Котировки (MOEX, Crypto)
- ✅ Инфляция
- ✅ Голосовые (gTTS)

### Premium (Telegram Stars):
- ✅ AI Репетитор
- ✅ AI Юрист
- ✅ AI Учитель языков
- ✅ Безлимитные запросы

---

## 🎯 Что работает сейчас

```
✅ Бот: @AidenHelpbot
✅ AI: бесплатные модели (OpenRouter)
✅ RAG: ChromaDB (локально)
✅ Погода: без API ключа
✅ TTS: gTTS (бесплатно)
✅ Котировки: MOEX + CoinGecko
✅ Планировщик: APScheduler
✅ Самообучение: активно
```

---

## 🔄 Миграция на Cloudflare (по шагам)

### Шаг 1: Подготовка

```bash
cd cloudflare
npm install
```

### Шаг 2: Создание ресурсов

```bash
# D1 База данных
wrangler d1 create ai-digest-bot-db

# KV хранилища
wrangler kv namespace create "RAG_STORE"
wrangler kv namespace create "CONVERSATION_STORE"
```

### Шаг 3: Обновление wrangler.toml

Заполнить ID из шага 2.

### Шаг 4: Деплой

```bash
wrangler deploy
```

### Шаг 5: Webhook

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://ai-digest-bot.<subdomain>.workers.dev"
```

---

## ⚠️ Важные заметки

1. **RAG на Cloudflare** — упрощённая версия (KV вместо векторного поиска)
2. **Планировщик** — CRON только на платных тарифах Cloudflare
3. **TTS gTTS** — может иметь лимиты, для продакшена рассмотреть ElevenLabs

---

## 🎉 Итого

**Бот работает полностью бесплатно:**
- ✅ AI через OpenRouter (free модели)
- ✅ Погода без API ключа
- ✅ TTS через gTTS
- ✅ Котировки из открытых API

**Для работы 24/7:**
- Локально: `./start_bot.sh` + crontab
- Cloudflare: `wrangler deploy`
