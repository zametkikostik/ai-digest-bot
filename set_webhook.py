#!/usr/bin/env python3
"""
Скрипт настройки Telegram Webhook для Cloudflare Workers бота
"""
import requests
import json

# Конфигурация
BOT_TOKEN = "8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc"
WORKER_URL = "https://ai-digest-bot.zametkikostik.workers.dev"  # ← Замените на ваш URL

def set_webhook():
    """Настроить webhook"""
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/setWebhook"
    
    data = {
        "url": WORKER_URL,
        "allowed_updates": ["message", "callback_query", "inline_query"]
    }
    
    response = requests.post(url, json=data)
    result = response.json()
    
    print("=" * 50)
    print("🔧 Настройка Telegram Webhook")
    print("=" * 50)
    print(f"Bot Token: {BOT_TOKEN[:20]}...")
    print(f"Worker URL: {WORKER_URL}")
    print()
    
    if result.get("ok"):
        print("✅ Webhook успешно настроен!")
        print()
        print("📋 Информация:")
        print(f"  URL: {result.get('result', {}).get('url', 'N/A')}")
        print(f"  Has custom certificate: {result.get('result', {}).get('has_custom_certificate', False)}")
        print()
        print("🤖 Проверьте бота в Telegram:")
        print("  1. Откройте Telegram")
        print("  2. Найдите вашего бота")
        print("  3. Нажмите Start или отправьте /start")
    else:
        print("❌ Ошибка настройки webhook!")
        print(f"  Error: {result.get('description', 'Unknown error')}")
    
    print("=" * 50)
    
    return result.get("ok", False)

def get_webhook_info():
    """Получить информацию о webhook"""
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getWebhookInfo"
    
    response = requests.get(url)
    result = response.json()
    
    print()
    print("=" * 50)
    print("📊 Текущая информация о Webhook")
    print("=" * 50)
    
    if result.get("ok"):
        info = result.get("result", {})
        print(f"  URL: {info.get('url', 'Not set')}")
        print(f"  Pending updates: {info.get('pending_update_count', 0)}")
        print(f"  Last error date: {info.get('last_error_date', 'None')}")
        print(f"  Last error message: {info.get('last_error_message', 'None')}")
    else:
        print(f"  ❌ Error: {result.get('description', 'Unknown error')}")
    
    print("=" * 50)
    
    return result.get("ok", False)

if __name__ == "__main__":
    print()
    
    # Сначала проверим текущий статус
    get_webhook_info()
    
    print()
    response = input("Настроить webhook? (y/n): ").strip().lower()
    
    if response == 'y':
        set_webhook()
    else:
        print("Отменено.")
    
    print()
