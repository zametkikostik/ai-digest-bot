#!/usr/bin/env python3
"""Тест кнопок Telegram"""
import requests

BOT_TOKEN = "8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc"
CHAT_ID = "1271633868"

# Тест с кнопками
keyboard = {
    "inline_keyboard": [
        [{"text": "📚 Категории", "callback_data": "faq_categories"}, 
         {"text": "❓ Помощь", "callback_data": "help"}],
        [{"text": "💎 Premium", "callback_data": "premium_info"}]
    ]
}

response = requests.post(
    f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
    json={
        "chat_id": CHAT_ID,
        "text": "🧪 ТЕСТ КНОПОК\n\nПроверка inline клавиатуры:",
        "reply_markup": keyboard,
        "parse_mode": "Markdown"
    }
)

print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

if response.status_code == 200:
    print("\n✅ Кнопки отправлены! Проверьте бот @AidenHelpbot")
else:
    print(f"\n❌ Ошибка: {response.json()['description']}")
