# 🤖 AI Digest Bot

**Telegram бот с AI, RAG поиском и автопостингом**

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/badge.svg)](https://deploy.workers.cloudflare.com/?url=https://github.com/zametkikostik/ai-digest-bot)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/zametkikostik/ai-digest-bot/deploy.yml)
![License](https://img.shields.io/github/license/zametkikostik/ai-digest-bot)

---

## 📋 Оглавление

- [Возможности](#-возможности)
- [Быстрый старт](#-быстрый-старт)
- [Установка](#-установка)
- [Команды бота](#-команды-бота)
- [Cloudflare Workers](#-cloudflare-workers)
- [База знаний (RAG)](#-база-знаний-rag)
- [Безопасность](#-безопасность)
- [Структура проекта](#-структура-проекта)

---

## ✨ Возможности

### 🎯 Основные функции
- **AI-ассистент** — ответы на вопросы через OpenRouter API
- **RAG поиск** — поиск по базе знаний с эмбеддингами
- **Самообучение** — добавление знаний через `/add`
- **Автопостинг** — 3 поста в день (9:00, 14:00, 19:30)

### 📚 База знаний и FAQ
- **Категории вопросов** — навигация по темам с inline-кнопками
- **Поиск по вопросам** — быстрый поиск по ключевым словам
- **Статистика просмотров** — отслеживание популярных вопросов
- **Админ-панель** — управление категориями и вопросами

### 📚 Образовательный раздел
- **🏫 Школа** — 13 предметов
- **🎓 ВУЗ** — 11 предметов
- **🌿 Сад и Огород** — 18 культур с фото

### 💰 Монетизация
- **Telegram Stars** — оплата подписок
- **Реферальная система** — 50⭐ за друга
- **PREMIUM** — расширенные функции

### 🛡️ Модерация
- Удаление ссылок в чатах
- Система предупреждений
- Бан/мут пользователей

---

## 🚀 Быстрый старт

### 1. Клонирование репозитория
```bash
git clone https://github.com/zametkikostik/ai-digest-bot.git
cd ai-digest-bot
```

### 2. Установка зависимостей
```bash
# Python зависимости
pip3 install -r requirements.txt

# Cloudflare (опционально)
cd cloudflare && npm install
```

### 3. Настройка
```bash
# Копируем шаблон
cp .env.example .env

# Редактируем .env
nano .env
```

### 4. Запуск
```bash
# Локальный запуск
python3 bot.py

# Cloudflare деплой
cd cloudflare && wrangler deploy
```

---

## 📦 Установка

### Требования
- Python 3.10+
- Node.js 18+ (для Cloudflare)
- Telegram Bot Token (@BotFather)
- OpenRouter API Key (опционально)

### Локальная установка

1. **Установите Python зависимости:**
```bash
pip3 install -r requirements.txt
```

2. **Настройте окружение:**
```bash
# .env
BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
ADMIN_IDS="1271633868"
OPENROUTER_API_KEY=your_key
```

3. **Инициализируйте базу данных:**
```bash
python3 -c "from database import init_db; init_db()"
```

4. **Запустите бота:**
```bash
python3 bot.py
```

### Cloudflare Workers (Production)

1. **Настройте Cloudflare:**
```bash
cd cloudflare

# Установите зависимости
npm install

# Настройте переменнные в Cloudflare Dashboard:
# - BOT_TOKEN
# - ADMIN_IDS
# - CHANNEL_ID
# - OPENROUTER_API_KEY
```

2. **Задеплойте:**
```bash
# Автоматически через GitHub Actions (рекомендуется)
git push

# Или вручную
wrangler deploy
```

3. **Настройте вебхук:**
```bash
python3 set_webhook.py
```

---

## 📱 Команды бота

### Базовые команды
| Команда | Описание |
|---------|----------|
| `/start` | Запустить бота |
| `/help` | Список команд |
| `/ask [вопрос]` | Задать вопрос AI |

### Образовательные
| Команда | Описание |
|---------|----------|
| `/school [предмет]` | Школьные предметы |
| `/university [предмет]` | ВУЗ предметы |
| `/garden` | Сад и огород (18 культур) |
| `/tutor` | AI-репетитор |

### Поиск и знания
| Команда | Описание |
|---------|----------|
| `/search [запрос]` | RAG поиск по базе |
| `/faq` | Категории вопросов и ответов |
| `/add [текст]` | Добавить в базу (admin) |
| `/knowledge` | Список знаний (admin) |
| `/del [ключ]` | Удалить знание (admin) |
| `/addcategory` | Добавить категорию (admin) |
| `/addquestion` | Добавить вопрос (admin) |
| `/listcategories` | Список категорий (admin) |
| `/faqs` | Статистика FAQ (admin) |

### Платные функции
| Команда | Описание |
|---------|----------|
| `/paid` | PREMIUM функции |
| `/ref` | Реферальная система |

### Утилиты
| Команда | Описание |
|---------|----------|
| `/weather [город]` | Погода |
| `/invest` | Инвестиции |
| `/crypto` | Криптовалюты |
| `/business` | Бизнес |
| `/inflation` | Инфляция |

---

## ☁️ Cloudflare Workers

### Архитектура
```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Telegram  │────▶│  Cloudflare      │────▶│  KV Store   │
│   Webhook   │     │  Workers         │     │  (RAG)      │
└─────────────┘     └──────────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │  D1 Database     │
                    │  (Posts, Users)  │
                    └──────────────────┘
```

### Cron расписание
```toml
[triggers]
crons = ["0 9 * * *", "0 14 * * *", "30 19 * * *"]
```

### Переменные окружения
Настройте в Cloudflare Dashboard → Workers → Settings → Variables:
- `BOT_TOKEN` — токен бота
- `ADMIN_IDS` — ID админов
- `CHANNEL_ID` — канал для постов
- `OPENROUTER_API_KEY` — AI ключ

---

## 📚 База знаний (RAG)

### Добавление знаний
```
/add Томаты любят солнечный свет и обильный полив.
```

### Поиск
```
/search томаты
```

### Управление (admin)
```
/knowledge          # Показать все знания
/del knowledge_123  # Удалить по ключу
```

---

## 📚 Система категорий и FAQ

### Быстрый старт

1. **Заполните тестовыми данными:**
```bash
python fill_faq_data.py
```

2. **Проверьте категории:**
```
/faq
```

3. **Добавьте свои категории:**
```
/addcategory 🤖 Основы AI|Базовые понятия|🤖
/addquestion 1|Что такое AI?|Искусственный интеллект это...|ai, определение
```

### Команды управления

| Команда | Описание |
|---------|----------|
| `/addcategory Название\|Описание\|Emoji` | Создать категорию |
| `/editcategory ID\|Название\|...` | Редактировать категорию |
| `/deletecategory ID` | Удалить категорию |
| `/addquestion ID\|Вопрос\|Ответ\|Ключевые слова` | Добавить вопрос |
| `/editquestion ID\|Вопрос\|Ответ\|...` | Редактировать вопрос |
| `/deletequestion ID` | Удалить вопрос |
| `/listcategories` | Показать все категории |
| `/listquestions ID` | Вопросы категории |
| `/faqs` | Статистика FAQ |

Подробнее в [FAQ_GUIDE.md](FAQ_GUIDE.md)

---

## 🔒 Безопасность

### Никогда не коммитьте:
- ✅ `.env` файлы
- ✅ Токены и ключи
- ✅ Базы данных
- ✅ Логи

### Используйте:
- ✅ `.env.example` как шаблон
- ✅ Cloudflare Secrets для prod
- ✅ GitHub Secrets для CI/CD

Подробнее в [SECURITY.md](SECURITY.md)

---

## 📁 Структура проекта

```
ai-digest-bot/
├── bot.py                 # Точка входа (локальный)
├── config.py              # Конфигурация
├── requirements.txt       # Python зависимости
├── .env.example           # Шаблон окружения
├── .gitignore             # Игнор файлы
│
├── cloudflare/            # Cloudflare Workers
│   ├── src/worker.js      # Основной код
│   ├── wrangler.toml      # Конфигурация
│   ├── schema.sql         # D1 схема
│   └── package.json       # Node зависимости
│
├── core/                  # Ядро бота
│   ├── ai_client.py       # AI клиент
│   ├── rag.py             # RAG поиск
│   └── scheduler.py       # Планировщик
│
├── database/              # База данных
│   ├── models.py          # SQLAlchemy модели
│   └── crud.py            # CRUD операции
│
├── handlers/              # Обработчики
│   ├── user.py            # Пользователи
│   ├── admin.py           # Админка
│   └── moderation.py      # Модерация
│
└── prompts/               # Промпты
    └── system.py          # Системные промпты
```

---

## 📄 Лицензия

MIT License — см. [LICENSE](LICENSE)

---

## 👥 Контакты

- **Telegram:** [@zametkikostik](https://t.me/zametkikostik)
- **Бот:** [@AidenHelpbot](https://t.me/AidenHelpbot)
- **Канал:** [@investora_zametki](https://t.me/investora_zametki)

---

## 🙏 Благодарности

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [aiogram](https://docs.aiogram.dev/)
- [OpenRouter](https://openrouter.ai/)
- [Hugging Face](https://huggingface.co/)
