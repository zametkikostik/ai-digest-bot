# 🚀 Aiden Bot — Универсальный AI-ассистент с энциклопедическими знаниями

## 📋 Обновлённый функционал

### ✨ Новые возможности

1. **🧠 Самообучение**
   - Автоматическое сохранение полезных диалогов
   - Оценка качества ответов через AI
   - Добавление знаний в RAG базу
   - Обучение на основе обратной связи

2. **📚 Полная энциклопедия знаний**
   - 🎓 **Образование**: Школа, Вуз, Детский сад
   - 🤖 **AI**: Машинное обучение, нейросети, GPT
   - 💰 **Инвестиции**: MOEX, акции, облигации, ETF
   - ₿ **Криптовалюты**: Биткоин, Эфириум, Web3, DeFi
   - 🏢 **Бизнес**: Предпринимательство, маркетинг, налоги
   - 🌤️ **Погода**: Все города России и зарубежные
   - 📈 **Инфляция**: Реальные данные по России и миру
   - 🎁 **Premium**: Эксклюзивные возможности

3. **📊 Реальные данные в реальном времени**
   - Котировки акций с MOEX
   - Курсы криптовалют (CoinGecko)
   - Погода (OpenWeatherMap)
   - Инфляция и экономические показатели
   - Курсы фиатных валют

4. **🎙️ Голосовой ассистент Яндекс.Алиса**
   - Преобразование текста в речь (TTS)
   - Распознавание речи (STT)
   - Отправка голосовых сообщений
   - Выбор голоса, скорости, эмоции

5. **🔍 Умные категории**
   - Детальные ответы по каждой категории
   - Уточняющие вопросы
   - Inline-кнопки для навигации
   - Контекстная обработка

---

## 🛠️ Установка и запуск

### 1. Обновление зависимостей

```bash
cd "/home/kostik/aiden bot"
pip install -r requirements.txt
```

### 2. Настройка .env

Скопируйте `.env.example` в `.env` и заполните:

```bash
cp .env.example .env
nano .env
```

**Обязательные параметры:**
```env
# Telegram
BOT_TOKEN=your_bot_token

# OpenRouter (AI)
OPENROUTER_API_KEY=your_openrouter_key

# Yandex SpeechKit (Алиса) - опционально
YANDEX_API_KEY=your_yandex_api_key
YANDEX_FOLDER_ID=your_yandex_folder_id

# OpenWeatherMap (погода) - опционально
OPENWEATHER_API_KEY=your_openweather_key

# Admin IDs
ADMIN_IDS="your_telegram_id"
```

### 3. Загрузка базы знаний

```bash
python load_all_knowledge.py
```

**Что делает:**
- Загружает все энциклопедии в RAG базу
- Разбивает на чанки с метаданными
- Сохраняет в ChromaDB

**Ожидаемый результат:**
```
✅ Файлов обработано: 7
✅ Чанков загружено: 2,500+
✅ Категорий: 7
```

### 4. Запуск бота

```bash
python bot.py
```

**Проверка логов:**
```
✅ База данных инициализирована
✅ AI клиент и RAG система инициализированы
✅ Система самообучения инициализирована
✅ Яндекс.Алиса инициализирована
📡 Запуск polling...
```

---

## 📱 Команды бота

### Основные команды

| Команда | Описание |
|---------|----------|
| `/start` | Приветствие и регистрация |
| `/help` | Список всех команд |
| `/categories` | Все категории знаний |
| `/ask [вопрос]` | Задать вопрос AI |
| `/search [запрос]` | Поиск в базе знаний |
| `/faq` | Вопросы и ответы |

### Команды по категориям

| Команда | Категория | Примеры вопросов |
|---------|-----------|------------------|
| `/education` | 🎓 Образование | Как подготовиться к ЕГЭ? |
| `/ai` | 🤖 ИИ | Что такое трансформеры? |
| `/invest` | 💰 Инвестиции | Какие акции купить? |
| `/crypto` | ₿ Криптовалюты | Как купить биткоин? |
| `/business` | 🏢 Бизнес | Как открыть ИП? |
| `/weather [город]` | 🌤️ Погода | погода Москва |
| `/inflation` | 📈 Инфляция | Как защититься от инфляции? |
| `/premium` | 🎁 Premium | Оформить подписку |

---

## 🎯 Примеры использования

### 1. Вопрос по инвестициям

```
Пользователь: /invest
Бот: Показывает топ акций MOEX и криптовалют

Пользователь: Какие акции купить на 100000₽?
Бот: Даёт рекомендации с учётом реальных котировок
```

### 2. Вопрос по погоде

```
Пользователь: /weather
Бот: Показывает популярные города

Пользователь: Сочи
Бот: 🌤️ Погода в Сочи: +18°C, ясно
     Ощущается как: +17°C
     Влажность: 65%
     Ветер: 3 м/с
```

### 3. Вопрос по образованию

```
Пользователь: Как подготовиться к ЕГЭ по математике?
Бот: Даёт развёрнутый ответ с ресурсами и планом
```

### 4. Голосовое сообщение (если включена Алиса)

```python
# В коде бота
from core.yandex_alice import send_voice_message

await send_voice_message(
    bot=bot,
    chat_id=chat_id,
    text="Привет! Я Аиден, ваш AI-ассистент.",
    voice="alena",
    speed=1.0
)
```

---

## 🧠 Система самообучения

### Как работает

1. **Анализ диалога**
   - AI оценивает полезность ответа (0-1)
   - Если оценка > 0.85 → сохранение в базу

2. **Обратная связь**
   - "Спасибо" → +0.95 к полезности
   - "Не то" → пометка на проверку

3. **Добавление в RAG**
   - Форматирование вопрос-ответ
   - Сохранение в ChromaDB
   - Метаданные (оценка, дата)

### Включение/выключение

```env
# В .env
AUTO_LEARN_ENABLED=true
AUTO_LEARN_THRESHOLD=0.85
```

### Статистика самообучения

```python
from core.self_learning import self_learner

stats = await self_learner.get_learning_stats()
# {'auto_learned': 150, 'needs_review': 5, 'enabled': True}
```

---

## 📊 API для реальных данных

### MOEX (акции)

```python
from core.real_data import real_time_data

# Получить котировки
stocks = await real_time_data.get_moex_stocks()
# [{'ticker': 'GAZP', 'last': 175.50, 'change': 1.2, ...}]

# Получить индекс
index = await real_time_data.get_moex_index()
# {'name': 'Индекс Мосбиржи', 'value': 3250.5, ...}
```

### Криптовалюты

```python
# Курсы криптовалют
crypto = await real_time_data.get_crypto_rates()
# [{'symbol': 'BTC', 'price_usd': 67000, ...}]

# Web3 проекты по категориям
web3 = await real_time_data.get_web3_projects('defi')
# {'defi': [{'id': 'uniswap', 'price_usd': 7.5, ...}]}
```

### Погода

```python
# Погода в городе
weather = await real_time_data.get_weather('Москва')
# {'city': 'Москва', 'temp': 20, 'description': 'ясно', ...}

# Погода в нескольких городах
cities = await real_time_data.get_weather_multiple_cities(
    ['Москва', 'Петербург', 'Сочи']
)
```

### Инфляция

```python
# Данные об инфляции
inflation = await real_time_data.get_inflation_data('RU')
# {'country': 'Россия', 'current': 7.8, 'forecast_next_year': 5.5}
```

### Инвест-рекомендации

```python
# Персональные рекомендации
recommendations = await real_time_data.get_investment_recommendations(
    risk_profile='medium',
    amount=100000
)
# {'portfolio': {'stocks': 0.6, ...}, 'top_stocks': [...], ...}
```

---

## 🎙️ Яндекс.Алиса

### TTS (Текст в речь)

```python
from core.yandex_alice import yandex_alice

# Генерация речи
audio = await yandex_alice.text_to_speech_mp3(
    text="Привет! Я Алиса.",
    voice="alena",
    speed=1.0
)

# Отправка в Telegram
audio_file = io.BytesIO(audio)
await bot.send_voice(chat_id=chat_id, voice=audio_file)
```

### STT (Речь в текст)

```python
# Распознавание речи
text = await yandex_alice.speech_to_text(
    audio_data=audio_bytes,
    sample_rate=22050
)
```

### Настройки голоса

```python
# Выбор голоса
yandex_alice.set_voice("filipp")

# Выбор скорости (0.5-3.0)
yandex_alice.set_speed(1.2)

# Выбор эмоции (neutral, good, evil)
yandex_alice.set_emotion("good")
```

---

## 🗂️ Структура проекта

```
/home/kostik/aiden bot/
├── bot.py                      # Точка входа
├── config.py                   # Конфигурация
├── requirements.txt            # Зависимости
├── .env                        # Переменные окружения
│
├── core/
│   ├── ai_client.py           # AI клиент (OpenRouter)
│   ├── rag/                   # RAG система
│   ├── real_data.py           # Реальные данные (MOEX, погода...)
│   ├── self_learning.py       # Самообучение
│   └── yandex_alice.py        # Яндекс.Алиса
│
├── handlers/
│   ├── admin.py               # Админ команды
│   ├── user.py                # Пользовательские команды
│   ├── categories.py          # Категории знаний
│   └── moderation.py          # Модерация
│
├── prompts/
│   └── system_prompts.py      # Системные промпты
│
├── knowledge_base/docs/       # База знаний
│   ├── ai_complete.md
│   ├── investments_complete.md
│   ├── crypto_web3_complete.md
│   ├── business_complete.md
│   ├── weather_complete.md
│   ├── inflation_economy_complete.md
│   └── education_complete.md
│
├── load_all_knowledge.py      # Скрипт загрузки знаний
└── chroma_db/                 # ChromaDB (векторная база)
```

---

## 🔧 Настройка API ключей

### 1. OpenRouter (AI)

1. Зарегистрируйтесь на https://openrouter.ai
2. Создайте API ключ в настройках
3. Добавьте в `.env`: `OPENROUTER_API_KEY=your_key`

### 2. Yandex SpeechKit (Алиса)

1. Создайте аккаунт в Yandex Cloud
2. Создайте платёжный аккаунт (есть бесплатный грант)
3. Создайте API ключ в консоли
4. Получите folder_id
5. Добавьте в `.env`:
   ```env
   YANDEX_API_KEY=your_key
   YANDEX_FOLDER_ID=your_folder_id
   ```

### 3. OpenWeatherMap (погода)

1. Зарегистрируйтесь на https://openweathermap.org
2. Создайте API ключ
3. Добавьте в `.env`: `OPENWEATHER_API_KEY=your_key`

### 4. CoinGecko (криптовалюты)

- Бесплатный API, ключ не требуется
- Для продакшена: https://www.coingecko.com/api/pricing

### 5. MOEX (акции)

- Бесплатный API, ключ не требуется
- Документация: https://www.moex.com/a2193

---

## 🚀 Продакшен

### Docker (опционально)

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "bot.py"]
```

### Systemd сервис

```ini
[Unit]
Description=Aiden Telegram Bot
After=network.target

[Service]
Type=simple
User=bot
WorkingDirectory=/home/kostik/aiden bot
ExecStart=/home/kostik/aiden bot/venv/bin/python bot.py
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable aiden-bot
sudo systemctl start aiden-bot
sudo systemctl status aiden-bot
```

---

## 📈 Метрики и мониторинг

### Логирование

Логи пишутся в:
- `bot.log` — файл логов
- stdout — консоль

Уровни логирования:
- `DEBUG` — детальная отладка
- `INFO` — основная информация
- `WARNING` — предупреждения
- `ERROR` — ошибки
- `CRITICAL` — критические ошибки

### Статистика бота

```python
# В админке
/stats

# Самообучение
/selflearn_stats
```

---

## ❓ FAQ

### Q: Бот не загружает знания
**A:** Проверьте путь к папке `knowledge_base/docs`. Убедитесь что файлы существуют.

### Q: Алиса не работает
**A:** Проверьте YANDEX_API_KEY и YANDEX_FOLDER_ID в `.env`. Убедитесь что есть баланс в Yandex Cloud.

### Q: Погода не отображается
**A:** Проверьте OPENWEATHER_API_KEY. Бесплатный тариф позволяет 60 запросов в минуту.

### Q: Самообучение не сохраняет диалоги
**A:** Проверьте `AUTO_LEARN_ENABLED=true` и порог `AUTO_LEARN_THRESHOLD`.

### Q: RAG поиск не находит ответы
**A:** Убедитесь что знания загружены через `load_all_knowledge.py`. Проверьте ChromaDB.

---

## 📞 Поддержка

- Telegram: @admin
- GitHub: Issues
- Документация: /help

---

## 📝 Лицензия

MIT License

---

*Создано с ❤️ для универсального AI-ассистента Aiden*
*Последнее обновление: 2024*
