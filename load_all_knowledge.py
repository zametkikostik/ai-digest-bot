#!/usr/bin/env python3
"""
Скрипт загрузки полной базы знаний в RAG систему бота
Загружает все энциклопедии: AI, Инвестиции, Крипта, Бизнес, Погода, Инфляция, Образование
"""
import os
import sys
import logging
from pathlib import Path
from datetime import datetime

# Добавляем корень проекта в path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from core.rag import RAGRetriever
from config import config

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Пути
KNOWLEDGE_DIR = project_root / "knowledge_base" / "docs"
CATEGORIES = {
    "ai_complete.md": "AI",
    "investments_complete.md": "Инвестиции",
    "crypto_web3_complete.md": "Криптовалюты и Web3",
    "business_complete.md": "Бизнес",
    "weather_complete.md": "Погода",
    "inflation_economy_complete.md": "Инфляция и Экономика",
    "education_complete.md": "Образование (Школа, Вуз, Сад)",
}


def chunk_text(text: str, chunk_size: int = 512, overlap: int = 64) -> list:
    """
    Разбиение текста на чанки с перекрытием

    Args:
        text: Исходный текст
        chunk_size: Размер чанка в символах
        overlap: Перекрытие между чанками

    Returns:
        Список чанков
    """
    chunks = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end]

        # Пытаемся разбить по предложению или абзацу
        if end < text_length:
            # Ищем последнюю точку, newline или пробел
            last_break = max(
                chunk.rfind('. '),
                chunk.rfind('\n'),
                chunk.rfind(' ')
            )
            if last_break > chunk_size // 2:
                chunk = chunk[:last_break + 1]
                end = start + last_break + 1

        chunks.append(chunk.strip())
        start = end - overlap

    return chunks


def load_file(filepath: Path) -> str:
    """Чтение файла"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def main():
    """Основная функция"""
    logger.info("=" * 60)
    logger.info("🚀 Загрузка полной базы знаний в RAG систему")
    logger.info("=" * 60)
    logger.info(f"Дата: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Папка знаний: {KNOWLEDGE_DIR}")
    logger.info("")

    # Проверка существования папки
    if not KNOWLEDGE_DIR.exists():
        logger.error(f"❌ Папка знаний не найдена: {KNOWLEDGE_DIR}")
        logger.info("💡 Создайте папку и добавьте файлы знаний")
        return

    # Инициализация RAG
    logger.info("📡 Инициализация RAG системы...")
    try:
        rag = RAGRetriever(config.CHROMA_DB_PATH)
        logger.info("✅ RAG система инициализирована")
    except Exception as e:
        logger.error(f"❌ Ошибка инициализации RAG: {e}")
        return

    # Статистика
    total_files = 0
    total_chunks = 0
    total_categories = set()

    # Загрузка всех файлов
    for filename, category in CATEGORIES.items():
        filepath = KNOWLEDGE_DIR / filename

        if not filepath.exists():
            logger.warning(f"⚠️ Файл не найден: {filename}")
            continue

        total_files += 1
        total_categories.add(category)

        logger.info("")
        logger.info(f"📚 Обработка: {filename}")
        logger.info(f"   Категория: {category}")

        try:
            # Чтение файла
            text = load_file(filepath)
            file_size = len(text)
            logger.info(f"   Размер: {file_size:,} символов")

            # Разбиение на чанки
            chunks = chunk_text(
                text,
                chunk_size=config.RAG_CHUNK_SIZE,
                overlap=config.RAG_CHUNK_OVERLAP
            )
            logger.info(f"   Чанков: {len(chunks)}")

            # Добавление в RAG с метаданными
            full_metadata = {
                "source": filename,
                "category": category,
                "loaded_at": datetime.now().isoformat()
            }
            
            try:
                rag.add_document(text, source=filename, metadata=full_metadata)
                total_chunks += 1
                logger.info(f"   ✅ Документ загружен")
            except Exception as e:
                logger.error(f"   ❌ Ошибка добавления документа: {e}")

        except Exception as e:
            logger.error(f"   ❌ Ошибка обработки файла: {e}")
            continue

    # Финальная статистика
    logger.info("")
    logger.info("=" * 60)
    logger.info("📊 Итоговая статистика")
    logger.info("=" * 60)
    logger.info(f"✅ Файлов обработано: {total_files}")
    logger.info(f"✅ Чанков загружено: {total_chunks:,}")
    logger.info(f"✅ Категорий: {len(total_categories)}")
    logger.info("")
    logger.info("Категории:")
    for cat in sorted(total_categories):
        logger.info(f"  • {cat}")
    logger.info("")
    logger.info(f"📁 ChromaDB путь: {config.CHROMA_DB_PATH}")
    logger.info("")
    logger.info("💡 Теперь бот использует эти знания для ответов!")
    logger.info("=" * 60)

    # Тестовый запрос
    logger.info("")
    logger.info("🧪 Тестовый поиск...")
    try:
        test_query = "Что такое искусственный интеллект?"
        results = rag.retrieve(test_query, top_k=3)
        if results:
            logger.info(f"✅ Найдено результатов: {len(results)}")
            logger.info(f"   Первый результат: {results[:100]}...")
        else:
            logger.warning("⚠️ Ничего не найдено по тестовому запросу")
    except Exception as e:
        logger.error(f"❌ Ошибка тестового поиска: {e}")

    logger.info("")
    logger.info("🎉 Загрузка завершена успешно!")
    logger.info("=" * 60)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("\n⚠️ Прервано пользователем")
        sys.exit(1)
    except Exception as e:
        logger.critical(f"❌ Критическая ошибка: {e}")
        sys.exit(1)
