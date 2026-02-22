# Telegram Universal Bot

AI-бот для Telegram с RAG-системой, автопостингом и модерацией.

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
pip install -r requirements.txt
```

### 2. Настройка

Отредактируйте файл `.env`:

```env
BOT_TOKEN=ваш_токен_бота
OPENROUTER_API_KEY=ваш_ключ_openrouter
CHANNEL_ID=-100xxxxxxxxxx  # ID канала (опционально)
GROUP_ID=-100xxxxxxxxxx    # ID группы для модерации (опционально)
ADMIN_IDS=123456789        # ID администраторов
```

### 3. Запуск

```bash
python bot.py
```

## 📋 Команды

### Для всех пользователей
- `/start` — Приветствие
- `/help` — Список команд
- `/ask [вопрос]` — Задать вопрос AI
- `/search [запрос]` — Поиск в базе знаний
- `/rules` — Правила чата

### Для администраторов
- `/generate [тема]` — Сгенерировать пост
- `/schedule` — Расписание постов
- `/contentplan` — Контент-план на 7 дней
- `/addknowledge` — Добавить документ в базу знаний
- `/stats` — Статистика бота
- `/publish` — Опубликовать пост из очереди

### Для модераторов
- `/ban @user` — Забанить пользователя
- `/unban @user` — Разбанить
- `/warn @user` — Предупреждение
- `/mute @user` — Замутить
- `/del` — Удалить сообщение
- `/clear [count]` — Очистить сообщения

## 🏗️ Архитектура

```
bot.py                  # Точка входа
config.py               # Конфигурация
handlers/
  ├── admin.py          # Команды админа
  ├── user.py           # Ответы пользователям
  └── moderation.py     # Модерация
core/
  ├── ai_client.py      # OpenRouter API
  ├── moderation.py     # Модуль модерации
  ├── scheduler.py      # Планировщик постов
  └── rag/
      ├── embedder.py   # Векторизация
      ├── vectorstore.py # ChromaDB
      └── retriever.py  # RAG-поиск
database/
  ├── models.py         # SQLAlchemy модели
  └── crud.py           # CRUD операции
knowledge_base/         # Документы RAG
prompts/
  └── system_prompts.py # Промпты
```

## 🔧 Особенности

### AI-модели (OpenRouter)
- **heavy** (`qwen/qwen3-235b-a22b:free`) — Генерация постов
- **reason** (`deepseek/deepseek-r1:free`) — Модерация, аналитика
- **fast** (`mistralai/mistral-7b-instruct:free`) — Быстрые ответы

### RAG-система
- Векторизация: `sentence-transformers/all-MiniLM-L6-v2`
- Хранилище: ChromaDB (персистентное)
- Чанкирование: 512 символов, перекрытие 64

### Модерация
- Быстрые правила (regex-паттерны)
- AI-модерация через OpenRouter
- Автоматический бан после 3 предупреждений

## 📝 Лицензия

MIT
