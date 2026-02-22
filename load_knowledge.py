#!/usr/bin/env python3
"""
Скрипт загрузки знаний в RAG базу бота
"""
import os
import hashlib
import requests

# Конфигурация Cloudflare KV
KV_NAMESPACE_ID = "d7fe61b4e39b4607af339e57cee0bca1"  # RAG_STORE
CLOUDFLARE_API_TOKEN = "RT8w1MwRQLpHMmGGnlCH-wqqZEtLoGNcxYUqhdTF"
ACCOUNT_ID = "9d3f70325c3f26a70c09c2d13b981f3c"

# Папка с знаниями
KNOWLEDGE_DIR = "/home/kostik/aiden bot/knowledge_base/docs"

def chunk_text(text, size=512, overlap=64):
    """Разбиение текста на чанки"""
    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunk = text[start:end]
        if end < len(text):
            last_space = chunk.rfind(' ')
            if last_space > size // 2:
                chunk = chunk[:last_space]
                end = start + last_space
        chunks.append(chunk.strip())
        start = end - overlap
    return chunks

def upload_to_kv(key, value):
    """Загрузка в Cloudflare KV"""
    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/storage/kv/namespaces/{KV_NAMESPACE_ID}/values/{key}"
    
    headers = {
        "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
        "Content-Type": "text/plain"
    }
    
    response = requests.put(url, headers=headers, data=value)
    return response.json()

def load_file(filepath):
    """Чтение файла"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def main():
    print("📚 Загрузка знаний в RAG базу...")
    print()
    
    # Создаём папку если нет
    os.makedirs(KNOWLEDGE_DIR, exist_ok=True)
    
    # Пример файла если нет файлов
    if not os.listdir(KNOWLEDGE_DIR):
        example_file = os.path.join(KNOWLEDGE_DIR, "ai_basics.txt")
        with open(example_file, 'w', encoding='utf-8') as f:
            f.write("""
# Основы Искусственного Интеллекта

## Что такое ИИ?

Искусственный интеллект (ИИ) — способность компьютерных систем решать задачи, 
требующие человеческого интеллекта: обучение, понимание языка, распознавание образов.

## Виды ИИ

1. **Слабый ИИ (Narrow AI)** — решает конкретные задачи:
   - Siri, Alexa, Google Assistant
   - Рекомендательные системы
   - Распознавание лиц

2. **Сильный ИИ (AGI)** — универсальный интеллект:
   - Пока не создан
   - Может решать любые интеллектуальные задачи

## Машинное обучение

**Машинное обучение (ML)** — метод создания ИИ через обучение на данных.

**Глубокое обучение (Deep Learning)** — использование нейронных сетей:
- Сверточные сети (CNN) — для изображений
- Трансформеры — для текста (GPT, BERT)
- Рекуррентные сети (RNN) — для последовательностей

## Нейронные сети

Нейронная сеть — математическая модель, вдохновлённая мозгом.

**Слои:**
- Входной слой — получает данные
- Скрытые слои — обрабатывают информацию
- Выходной слой — выдаёт результат

**Функция активации** — определяет, передавать ли сигнал дальше:
- ReLU, Sigmoid, Tanh

## GPT и трансформеры

**Трансформер** — архитектура нейросети для обработки текста.

**GPT (Generative Pre-trained Transformer)**:
- GPT-3 — 175 млрд параметров
- GPT-4 — мультимодальная модель
- ChatGPT — чат-бот на базе GPT

**Принцип работы:**
1. Токенизация — разбиение текста на части
2. Embedding — векторное представление
3. Attention — внимание к важным частям
4. Генерация — предсказание следующего токена

## Применение ИИ

- 📝 Генерация текста
- 🎨 Генерация изображений (Midjourney, DALL-E)
- 💻 Написание кода (GitHub Copilot)
- 🎵 Генерация музыки
- 🏥 Диагностика заболеваний
- 🚗 Автопилоты

## Этика ИИ

**Проблемы:**
- Предвзятость в данных
- Конфиденциальность
- Замена рабочих мест
- Безопасность

**Принципы:**
- Прозрачность
- Справедливость
- Подотчётность
- Безопасность
""")
        print(f"✅ Создан пример: {example_file}")
    
    # Загрузка всех файлов
    total_chunks = 0
    
    for filename in os.listdir(KNOWLEDGE_DIR):
        if filename.endswith(('.txt', '.md')):
            filepath = os.path.join(KNOWLEDGE_DIR, filename)
            print(f"📄 Обработка: {filename}")
            
            text = load_file(filepath)
            chunks = chunk_text(text)
            
            for i, chunk in enumerate(chunks):
                key = f"doc_{hashlib.md5(filename.encode()).hexdigest()[:8]}_{i}"
                result = upload_to_kv(key, chunk)
                
                if result.get('success'):
                    total_chunks += 1
                    print(f"   ✅ Чанк {i+1}/{len(chunks)}")
                else:
                    print(f"   ❌ Ошибка: {result}")
    
    print()
    print("=" * 50)
    print(f"✅ Загружено чанков: {total_chunks}")
    print(f"📁 Папка знаний: {KNOWLEDGE_DIR}")
    print()
    print("💡 Теперь бот будет использовать эти знания!")
    print("=" * 50)

if __name__ == "__main__":
    main()
