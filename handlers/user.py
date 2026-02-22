"""
Хэндлеры для общения с пользователями
"""
import logging
from aiogram import Router, F, types
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from sqlalchemy.orm import Session
from core.ai_client import OpenRouterClient
from core.rag import RAGRetriever
from prompts import SYSTEM_PROMPT, USER_REPLY_PROMPT
from database import crud
from config import config

logger = logging.getLogger(__name__)

router = Router()


class AskState(StatesGroup):
    """Состояния для режима вопроса"""
    waiting = State()


# ==================== БАЗОВЫЕ КОМАНДЫ ====================

@router.message(Command("start"))
async def cmd_start(message: types.Message):
    """Команда /start"""
    db = crud.get_session()
    
    # Регистрация пользователя
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


@router.message(Command("help"))
async def cmd_help(message: types.Message):
    """Команда /help"""
    text = "📖 **Справка**:\n\n"
    
    text += "**Для всех**:\n"
    text += "• /start — приветствие\n"
    text += "• /ask [вопрос] — задать вопрос AI\n"
    text += "• /search [запрос] — поиск в БЗ\n"
    text += "• /rules — правила чата\n\n"
    
    text += "**Для администраторов**:\n"
    text += "• /generate [тема] — создать пост\n"
    text += "• /schedule — расписание\n"
    text += "• /contentplan — контент-план\n"
    text += "• /addknowledge — добавить в БЗ\n"
    text += "• /stats — статистика\n\n"
    
    text += "**Для модераторов**:\n"
    text += "• /ban @user — забанить\n"
    text += "• /warn @user — предупреждение\n"
    text += "• /unban @user — разбанить\n"
    
    await message.reply(text, parse_mode='Markdown')


@router.message(Command("rules"))
async def cmd_rules(message: types.Message):
    """Команда /rules"""
    text = (
        "📜 **Правила чата**:\n\n"
        "1️⃣ Уважайте других участников\n"
        "2️⃣ Запрещён спам и реклама\n"
        "3️⃣ Запрещены оскорбления и мат\n"
        "4️⃣ Запрещён NSFW контент\n"
        "5️⃣ Запрещены персональные данные\n"
        "6️⃣ Запрещены ссылки на сторонние ресурсы\n"
        "7️⃣ Соблюдайте тему канала\n\n"
        "⚠️ Нарушения ведут к предупреждениям, "
        "удалению сообщений и бану."
    )
    
    await message.reply(text, parse_mode='Markdown')


# ==================== ВОПРОСЫ К AI ====================

@router.message(Command("ask"))
async def cmd_ask(message: types.Message, ai_client: OpenRouterClient, rag: RAGRetriever):
    """
    Задать вопрос AI
    Использование: /ask [вопрос]
    """
    question = message.text.replace("/ask", "").strip()
    
    if not question:
        await message.reply(
            "⚠️ Задайте вопрос.\n\n"
            "Пример: `/ask Как работает трансформеры?`",
            parse_mode='Markdown'
        )
        return
    
    # Rate limiting
    db = crud.get_session()
    if not crud.check_rate_limit(
        db,
        message.from_user.id,
        max_requests=config.RATE_LIMIT_PER_USER,
        window_minutes=1
    ):
        await message.reply(
            "⏳ Слишком много запросов. "
            f"Подождите {config.RATE_LIMIT_PER_USER} минут."
        )
        db.close()
        return
    db.close()
    
    await message.reply(f"⏳ Ищу ответ на вопрос: **{question}**...")
    
    try:
        # RAG-поиск
        rag_context = rag.retrieve(question)
        
        # Формирование запроса
        user_message = f"[ACTION: USER_REPLY]\n{question}"
        if rag_context:
            user_message += f"\n\n[RAG_CONTEXT]\n{rag_context}"
        
        # Ответ от AI
        response = await ai_client.complete(
            system=USER_REPLY_PROMPT,
            user=user_message,
            mode="fast" if len(question) < 50 else "heavy"
        )
        
        await message.reply(response, parse_mode='Markdown')
        
        # Сохранение контекста
        db = crud.get_session()
        context = crud.get_conversation_context(db, message.from_user.id) or []
        context.append({"role": "user", "content": question})
        context.append({"role": "assistant", "content": response})
        crud.save_conversation_context(db, message.from_user.id, context)
        db.close()
        
    except Exception as e:
        logger.error(f"Ошибка при ответе на вопрос: {e}")
        await message.reply(f"❌ Ошибка при обработке вопроса: {e}")


@router.message(Command("search"))
async def cmd_search(message: types.Message, rag: RAGRetriever):
    """
    Поиск в базе знаний
    Использование: /search [запрос]
    """
    query = message.text.replace("/search", "").strip()
    
    if not query:
        await message.reply(
            "⚠️ Введите запрос для поиска.\n\n"
            "Пример: `/search нейросети`",
            parse_mode='Markdown'
        )
        return
    
    # Поиск
    results = rag.retrieve(query, top_k=5)
    
    if not results:
        await message.reply(
            "🔍 Ничего не найдено по вашему запросу.\n\n"
            "Попробуйте добавить документы через /addknowledge"
        )
        return
    
    text = f"🔍 **Результаты поиска** по запросу \"{query}\":\n\n"
    text += results[:3000]  # Ограничение длины
    
    await message.reply(text, parse_mode='Markdown')


# ==================== ОБЫЧНЫЕ СООБЩЕНИЯ ====================

@router.message(~Command())
async def handle_message(message: types.Message, ai_client: OpenRouterClient, rag: RAGRetriever):
    """Обработка обычных сообщений"""
    db = crud.get_session()
    
    # Проверка на забаненного
    user = crud.get_user(db, message.from_user.id)
    if user and user.is_banned:
        db.close()
        return
    
    # Rate limiting
    if not crud.check_rate_limit(
        db,
        message.from_user.id,
        max_requests=config.RATE_LIMIT_PER_USER,
        window_minutes=1
    ):
        db.close()
        return
    
    # Получение контекста разговора
    context = crud.get_conversation_context(db, message.from_user.id) or []
    db.close()
    
    try:
        # RAG-поиск
        rag_context = rag.retrieve(message.text)
        
        # Формирование запроса с контекстом
        user_message = f"[ACTION: USER_REPLY]\n{message.text}"
        
        if context:
            user_message = f"Предыдущие сообщения:\n{context}\n\n{user_message}"
        
        if rag_context:
            user_message += f"\n\n[RAG_CONTEXT]\n{rag_context}"
        
        # Ответ от AI
        response = await ai_client.complete(
            system=USER_REPLY_PROMPT,
            user=user_message,
            mode="fast" if len(message.text) < 100 else "heavy"
        )
        
        await message.reply(response, parse_mode='Markdown')
        
        # Сохранение контекста
        db = crud.get_session()
        context.append({"role": "user", "content": message.text})
        context.append({"role": "assistant", "content": response})
        crud.save_conversation_context(db, message.from_user.id, context)
        db.close()
        
    except Exception as e:
        logger.error(f"Ошибка при обработке сообщения: {e}")
        # При ошибке AI — не отвечаем
