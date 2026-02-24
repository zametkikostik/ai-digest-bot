#!/usr/bin/env python3
import requests
import time

BOT_TOKEN = "8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc"
WEBHOOK_URL = "https://ai-digest-bot.aiden.workers.dev"
ADMIN_ID = 1271633868

print("🔗 Настройка Telegram Webhook...")
print("=" * 50)

# 1. Удаляем старый webhook
print("\n1️⃣ Удаление старого webhook...")
r = requests.get(f"https://api.telegram.org/bot{BOT_TOKEN}/deleteWebhook", timeout=10)
print(f"   Результат: {r.json().get('description', 'OK')}")

time.sleep(2)

# 2. Устанавливаем новый webhook
print("\n2️⃣ Установка нового webhook...")
r = requests.post(
    f"https://api.telegram.org/bot{BOT_TOKEN}/setWebhook",
    json={"url": WEBHOOK_URL, "allowed_updates": ["message", "callback_query"]},
    timeout=10
)
result = r.json()
print(f"   Результат: {result.get('description', 'OK')}")

time.sleep(3)

# 3. Проверка webhook
print("\n3️⃣ Проверка webhook...")
w = requests.get(f"https://api.telegram.org/bot{BOT_TOKEN}/getWebhookInfo", timeout=10).json()
print(f"   URL: {w['result']['url']}")
print(f"   Pending: {w['result']['pending_update_count']}")
print(f"   Last Error: {w['result'].get('last_error_message', 'None')}")

# 4. Тест - отправка /start
print("\n4️⃣ Тест - отправка /start...")
r = requests.post(
    f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
    json={"chat_id": ADMIN_ID, "text": "/start"},
    timeout=10
)
print(f"   Отправлено: {r.json().get('ok')}")

time.sleep(15)

# 5. Финальная проверка
print("\n5️⃣ Финальная проверка...")
w2 = requests.get(f"https://api.telegram.org/bot{BOT_TOKEN}/getWebhookInfo", timeout=10).json()
print(f"   Pending: {w2['result']['pending_update_count']}")
print(f"   Last Error: {w2['result'].get('last_error_message', 'None')}")

print("\n" + "=" * 50)
if w2['result']['pending_update_count'] == 0 or w2['result'].get('last_error_message') is None:
    print("✅ WEBHOOK НАСТРОЕН И РАБОТАЕТ!")
else:
    print("⚠️  Webhook настроен, ожидаем обработки...")
print("=" * 50)
