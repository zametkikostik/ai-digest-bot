# 🔑 API КЛЮЧИ И КОНФИГУРАЦИЯ

**Дата:** 24 февраля 2026 г.  
**Статус:** ✅ НАСТРОЕНО

---

## ✅ .ENV ФАЙЛ (РЕАЛЬНЫЕ КЛЮЧИ)

**Файл:** `/home/kostik/aiden bot/.env`

### Telegram
```
BOT_TOKEN=8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc
BOT_NAME=AI-дайджест
BOT_TOPIC=Всё об искусственном интеллекте за неделю
```

**Бот:**
- ID: 8341305314
- Username: @AidenHelpBot
- Статус: ✅ Работает

### OpenRouter (AI)
```
OPENROUTER_API_KEY=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
```

**Статус:** ✅ Настроен
**Модели:** Qwen, DeepSeek, Mistral, Google

### Admin
```
ADMIN_IDS=1271633868
```

**Admin:** @zametkikostik

### Каналы
```
CHANNEL_ID=-1001234567890
INVEST_CHANNEL=-1001644114424
```

---

## ⚠️ ОТСУТСТВУЮЩИЕ КЛЮЧИ

### Yandex SpeechKit (Алиса)
```env
# НЕ УСТАНОВЛЕНО
YANDEX_API_KEY=your_yandex_api_key_here
YANDEX_FOLDER_ID=your_yandex_folder_id_here
```

**Статус:** ❌ Отключено  
**Функции:** TTS (текст в речь), STT (речь в текст)

**Как получить:**
1. https://cloud.yandex.ru/
2. Создать аккаунт
3. Создать API ключ
4. Создать folder_id

**Цена:** Бесплатно (лимит 500к символов/мес)

### OpenWeatherMap (Погода)
```env
# НЕ УСТАНОВЛЕНО
OPENWEATHER_API_KEY=your_openweather_key_here
```

**Статус:** ❌ Отключено  
**Функции:** Погода в реальном времени

**Как получить:**
1. https://openweathermap.org/api
2. Зарегистрироваться
3. Получить API ключ

**Цена:** Бесплатно (лимит 60 вызовов/мин)

---

## ☁️ CLOUDFLARE КОНФИГУРАЦИЯ

### Worker
**Имя:** `ai-digest-bot`  
**Файл:** `cloudflare/src/worker.js`  
**Статус:** ✅ Настроен

### D1 Database
```toml
database_name = "ai-digest-bot-db"
database_id = "cee284b6-8392-4db8-8389-59bd9eafc869"
binding = "DB"
```

**Статус:** ✅ Подключено

### KV Namespaces

#### 1. RAG_STORE (База знаний)
```toml
binding = "RAG_STORE"
id = "d7fe61b4e39b4607af339e57cee0bca1"
```

**Использование:**
- Хранение чанков знаний
- RAG поиск
- Загрузка через `load_knowledge.py`

#### 2. CONVERSATION_STORE (Диалоги)
```toml
binding = "CONVERSATION_STORE"
id = "f3adf57a2e77412e8bb8dd38bb6394e4"
```

**Использование:**
- История диалогов
- Контекст разговора

### Workers AI
```toml
[ai]
binding = "AI"
```

**Модели:**
- `@cf/baai/bge-small-en-v1.5` — эмбеддинги
- `@cf/mistral/mistral-7b-instruct-v0.1` — генерация

### Cron Triggers (Расписание постов)
```toml
crons = ["0 9 * * *", "0 14 * * *", "30 19 * * *"]
```

**Время (UTC):**
- 09:00 — Утренний пост
- 14:00 — Дневной пост
- 19:30 — Вечерний пост

**Время (МСК):**
- 12:00 — Утренний пост
- 17:00 — Дневной пост
- 22:30 — Вечерний пост

---

## 📊 СРАВНЕНИЕ: LOCAL vs CLOUDFLARE

| Функция | Local (Python) | Cloudflare (Worker) |
|---------|----------------|---------------------|
| **RAG поиск** | ✅ ChromaDB | ✅ KV Namespace |
| **AI модель** | ✅ OpenRouter | ✅ Workers AI |
| **База данных** | ✅ SQLite | ✅ D1 Database |
| **Планировщик** | ✅ APScheduler | ✅ Cron Triggers |
| **Голос (Алиса)** | ❌ Нет ключа | ❌ Нет интеграции |
| **Погода** | ❌ Нет ключа | ❌ Нет интеграции |
| **MOEX** | ✅ Есть | ❌ Нет |
| **Крипта** | ✅ CoinGecko | ❌ Нет |

---

## 🚀 КОМАНДЫ ДЛЯ CLOUDFLARE

### Деплой
```bash
cd cloudflare
npm install
npm run deploy
```

### Проверка логов
```bash
wrangler tail
```

### Проверка KV
```bash
wrangler kv namespace list
wrangler kv key list --namespace-id d7fe61b4e39b4607af339e57cee0bca1 --prefix chunk_
```

### Проверка D1
```bash
wrangler d1 execute ai-digest-bot-db --command "SELECT * FROM posts LIMIT 5"
```

### Установка секретов
```bash
wrangler secret put BOT_TOKEN
wrangler secret put OPENROUTER_API_KEY
```

---

## 📝 ЧЕК-ЛИСТ НАСТРОЙКИ

### Local (Python)
- [x] BOT_TOKEN — установлен
- [x] OPENROUTER_API_KEY — установлен
- [x] ADMIN_IDS — установлен
- [ ] YANDEX_API_KEY — **не установлен**
- [ ] YANDEX_FOLDER_ID — **не установлен**
- [ ] OPENWEATHER_API_KEY — **не установлен**

### Cloudflare
- [x] Worker развёрнут
- [x] D1 Database подключена
- [x] KV Namespaces настроены
- [x] Workers AI доступен
- [x] Cron triggers настроены
- [ ] BOT_TOKEN в secrets — **проверить**
- [ ] OPENROUTER_API_KEY в secrets — **проверить**

---

## 🔒 БЕЗОПАСНОСТЬ

**Никогда не коммитьте `.env` в git!**

```bash
# Проверка .gitignore
cat .gitignore | grep env
# Должно быть: .env
```

**Cloudflare секреты:**
- Храните в Cloudflare Secrets
- Не в `wrangler.toml`
- Не в коде

---

## 📞 КОНТАКТЫ

**Admin:**
- Telegram: @zametkikostik
- ID: 1271633868

**Бот:**
- Telegram: @AidenHelpBot
- ID: 8341305314

**Канал:**
- @investora_zametki

---

*Конфигурация актуальна на 24.02.2026*  
*Aiden Bot 3.0*
