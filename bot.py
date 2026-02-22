"""
Telegram Universal Bot
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
from database import init_db, crud
from handlers import admin_router, user_router, moderation_router
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
    
    logger.info("AI клиент и RAG система инициализированы")
    
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
    @dp.middleware()
    async def dependencies_middleware(handler, event, data):
        data["ai_client"] = ai_client
        data["rag"] = rag
        data["scheduler"] = scheduler
        return await handler(event, data)
    
    # Запуск polling
    logger.info("Запуск polling...")
    
    try:
        await dp.start_polling(bot)
    except KeyboardInterrupt:
        logger.info("Остановка бота...")
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
