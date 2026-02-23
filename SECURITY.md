# 🔒 Security Policy

**Политика безопасности AI Digest Bot**

---

## 📋 Содержание

1. [Защищённые данные](#-защищённые-данные)
2. [Хранение секретов](#-хранение-секретов)
3. [Контроль доступа](#-контроль-доступа)
4. [Безопасность кода](#-безопасность-кода)
5. [Инциденты](#-инциденты)

---

## 🛡️ Защищённые данные

### Никогда не коммитьте в Git:

| Тип | Пример | Риск |
|-----|--------|------|
| **Токены ботов** | `123456:ABC-DEF...` | Критический |
| **API ключи** | `sk-...`, `key_...` | Критический |
| **Пароли** | Любые пароли | Критический |
| **Приватные ключи** | `*.pem`, `*.key` | Критический |
| **Базы данных** | `*.db`, `*.sqlite` | Высокий |
| **Логи** | `*.log` | Средний |
| **Персональные данные** | ID, телефоны | Высокий |

### Можно коммитьте:

| Тип | Пример |
|-----|--------|
| Шаблоны | `.env.example` |
| Публичные конфиги | `wrangler.toml` (без секретов) |
| Документация | `README.md` |

---

## 🔐 Хранение секретов

### Production (Cloudflare)

Используйте **Cloudflare Secrets**:

```bash
# Установка секрета
wrangler secret put BOT_TOKEN

# Список секретов
wrangler secret list
```

**Где:** Cloudflare Dashboard → Workers → Settings → Variables

### Development (Локально)

Используйте **.env** файл:

```bash
# Копирование шаблона
cp .env.example .env

# Редактирование (никогда не коммитьте!)
nano .env

# Проверка .gitignore
git check-ignore .env
```

### CI/CD (GitHub Actions)

Используйте **GitHub Secrets**:

1. Repository Settings → Secrets → Actions
2. New repository secret
3. Добавить:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

---

## 👥 Контроль доступа

### Администраторы

Только указанные `ADMIN_IDS` могут:
- Использовать `/add`, `/del`, `/knowledge`
- Получать статистику
- Управлять пользователями

### Пользователи

Ограничения:
- Rate limiting: 10 запросов/минуту
- Лимит на размер сообщений
- Бан за нарушения

---

## 💻 Безопасность кода

### Проверка кода

Перед коммитом:
```bash
# Python
python3 -m py_compile bot.py
python3 -m flake8 .

# JavaScript
cd cloudflare && node --check src/worker.js
```

### Зависимости

Регулярно обновляйте:
```bash
# Python
pip3 list --outdated
pip3 install --upgrade -r requirements.txt

# Node.js
cd cloudflare
npm outdated
npm update
```

### Уязвимости

Проверка:
```bash
# Python
pip3 install safety
safety check

# Node.js
npm audit
```

---

## 🚨 Инциденты

### Если токен скомпрометирован:

1. **Немедленно** отзовите токен:
   - Telegram: @BotFather → Revoke Token
   - OpenRouter: Dashboard → API Keys

2. **Обновите** секреты:
   ```bash
   wrangler secret put BOT_TOKEN
   ```

3. **Перезапустите** бота:
   ```bash
   wrangler deploy
   ```

4. **Проверьте** логи:
   ```bash
   wrangler tail
   ```

### Если утечка данных:

1. Заблокируйте доступ
2. Уведомите пользователей
3. Проведите аудит
4. Обновите политику безопасности

---

## 📊 Аудит безопасности

### Ежеквартально:

- [ ] Проверка .gitignore
- [ ] Ротация токенов
- [ ] Обновление зависимостей
- [ ] Анализ логов
- [ ] Проверка прав доступа

### При изменениях:

- [ ] Code review
- [ ] Проверка секретов
- [ ] Тестирование

---

## 📞 Контакты

По вопросам безопасности:
- **Email:** security@example.com
- **Telegram:** @konstantin_manager_nlstar

---

## 📜 Лицензия

Эта политика является частью проекта AI Digest Bot.
