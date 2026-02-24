"""
Telegram Universal Bot - Aiden
Универсальный AI-ассистент с энциклопедическими знаниями
Точка входа
"""
import asyncio
import logging
import sys
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.types import Message
from config import config
from core.ai_client import OpenRouterClient
from core.rag import RAGRetriever
from core.scheduler import PostScheduler
from core.self_learning import init_self_learner
from core.yandex_alice import init_yandex_alice
from core.real_data import RealTimeData
from database import init_db, crud
from handlers import admin_router, user_router, moderation_router, categories_router, premium_router
from prompts import SYSTEM_PROMPT

# Настройка логирования
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("bot.log", encoding="utf-8")
    ]
)

logger = logging.getLogger(__name__)


async def main():
    """Основная функция"""
    
    # Валидация конфигурации
    try:
        config.validate()
    except ValueError as e:
        logger.error(f"Ошибка конфигурации: {e}")
        return
    
    logger.info("=" * 50)
    logger.info(f"Запуск бота: {config.BOT_NAME}")
    logger.info(f"Тематика: {config.BOT_TOPIC}")
    logger.info("=" * 50)
    
    # Инициализация базы данных
    init_db()
    logger.info("База данных инициализирована")

    # Инициализация компонентов
    ai_client = OpenRouterClient(config.OPENROUTER_API_KEY)
    rag = RAGRetriever(config.CHROMA_DB_PATH)
    # Погода работает без API ключа (используются дефолтные данные)
    real_time_data = RealTimeData(None)

    logger.info("AI клиент и RAG система инициализированы")

    # Инициализация самообучения
    self_learner = init_self_learner(ai_client, rag)
    logger.info("Система самообучения инициализирована")

    # TTS через gTTS (бесплатно, без API ключей)
    logger.info("TTS через gTTS инициализирован (бесплатно)")
    
    # Создание бота и диспетчера
    bot = Bot(
        token=config.BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.MARKDOWN)
    )
    dp = Dispatcher()
    
    # Инициализация планировщика
    if config.CHANNEL_ID:
        scheduler = PostScheduler(bot, ai_client, rag, config.CHANNEL_ID)
        scheduler.start()
        logger.info("Планировщик постов запущен")
    else:
        scheduler = None
        logger.warning("CHANNEL_ID не указан, планировщик отключён")
    
    # Регистрация роутеров
    # Передаём зависимости через kwargs
    dp.include_router(admin_router)
    dp.include_router(user_router)
    dp.include_router(moderation_router)
    dp.include_router(categories_router)
    dp.include_router(premium_router)
    
    # Обработчик /start для регистрации пользователей
    @dp.message(CommandStart())
    async def cmd_start(message: Message):
        db = crud.get_session()
        crud.get_or_create_user(
            db,
            telegram_id=message.from_user.id,
            username=message.from_user.username,
            first_name=message.from_user.first_name,
            last_name=message.from_user.last_name
        )
        db.close()
        
        text = (
            f"👋 Привет, **{message.from_user.first_name}**!\n\n"
            f"Я — **{config.BOT_NAME}**, ваш AI-ассистент.\n"
            f"Тематика: _{config.BOT_TOPIC}_\n\n"
            "📋 **Доступные команды**:\n"
            "• /help — список всех команд\n"
            "• /ask [вопрос] — задать вопрос AI\n"
            "• /search [запрос] — поиск в базе знаний\n"
            "• /rules — правила чата\n\n"
            "Просто напишите мне, и я отвечу!"
        )
        await message.reply(text, parse_mode='Markdown')

    # Middleware для передачи зависимостей
    @dp.update.outer_middleware
    async def dependencies_middleware(handler, event, data):
        data["ai_client"] = ai_client
        data["rag"] = rag
        data["scheduler"] = scheduler
        return await handler(event, data)
    
    # Запуск polling
    logger.info("Запуск polling...")

    # Удаляем webhook, если он установлен (конфликт с polling)
    try:
        await bot.delete_webhook()
        logger.info("Webhook удалён (если был установлен)")
    except Exception as e:
        logger.warning(f"Не удалось удалить webhook: {e}")

    try:
        await dp.start_polling(bot)
    except KeyboardInterrupt:
        logger.info("Остановка бота...")
    except Exception as e:
        logger.critical(f"Ошибка polling: {e}")
        raise
    finally:
        # Очистка
        if scheduler:
            scheduler.stop()
        await ai_client.close()
        await bot.session.close()
        logger.info("Бот остановлен")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Бот остановлен пользователем")
    except Exception as e:
        logger.critical(f"Критическая ошибка: {e}")
        sys.exit(1)
