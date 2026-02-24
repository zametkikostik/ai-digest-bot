"""
Premium команды: AI Репетитор, AI Юрист, AI Учитель языков, AI SEO, AI Журналист
"""
import logging
from aiogram import Router, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from database import crud
from config import config

logger = logging.getLogger(__name__)

router = Router()


def check_premium_access(user_id: int) -> bool:
    """Проверка Premium доступа"""
    db = crud.get_session()
    user = crud.get_user(db, user_id)
    db.close()
    
    # Админ всегда имеет доступ
    if user_id in config.ADMIN_IDS:
        return True
    
    # Проверка Premium
    if user and user.is_premium:
        return True
    
    return False


@router.message(Command("tutor"))
async def cmd_tutor(message: types.Message):
    """
    AI Репетитор — Подготовка к ОГЭ/ЕГЭ
    Доступ: Premium или Admin (бесплатно)
    """
    # Проверка доступа (админ всегда имеет доступ)
    if message.from_user.id not in config.ADMIN_IDS:
        db = crud.get_session()
        user = crud.get_user(db, message.from_user.id)
        if not (user and user.is_premium):
            db.close()
            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="💎 Оформить Premium", callback_data="premium_buy")]
            ])
            await message.reply(
                "🎓 **AI Репетитор** — подготовка к ОГЭ/ЕГЭ\n\n"
                "📚 Предметы: Математика, Русский, Физика и др.\n"
                "✅ Объяснение тем простым языком\n"
                "📝 Генерация практики с проверкой\n"
                "🎯 Персональный план подготовки\n\n"
                "💰 Premium: 299₽/мес\n"
                "🎁 Админ: Бесплатно",
                reply_markup=keyboard,
                parse_mode='Markdown'
            )
            return
        db.close()
    
    text = (
        "🎓 **AI Репетитор** — подготовка к ОГЭ/ЕГЭ\n\n"
        "**Предметы**:\n"
        "📐 Математика\n"
        "📖 Русский язык\n"
        "⚛️ Физика\n"
        "📜 Обществознание\n"
        "📚 История\n"
        "🧬 Биология\n"
        "🧪 Химия\n"
        "💻 Информатика\n"
        "🇬🇧 Английский\n\n"
        "**Команды**:\n"
        "• `/tutor_math` — Математика\n"
        "• `/tutor_russian` — Русский язык\n"
        "• `/tutor_physics` — Физика\n"
        "• `/tutor_exam` — Пробный тест\n\n"
        "Напишите предмет или тему для начала!"
    )
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📐 Математика", callback_data="tutor_math")],
        [InlineKeyboardButton(text="📖 Русский", callback_data="tutor_russian")],
        [InlineKeyboardButton(text="⚛️ Физика", callback_data="tutor_physics")],
        [InlineKeyboardButton(text="📝 Пробный тест", callback_data="tutor_exam")]
    ])
    
    await message.reply(text, reply_markup=keyboard, parse_mode='Markdown')


# ==================== AI ЮРИСТ ====================

@router.message(Command("lawyer_ru"))
async def cmd_lawyer_ru(message: types.Message):
    """
    AI Юрист Россия
    Доступ: Premium или Admin (бесплатно)
    """
    if message.from_user.id not in config.ADMIN_IDS:
        db = crud.get_session()
        user = crud.get_user(db, message.from_user.id)
        if not (user and user.is_premium):
            db.close()
            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="💎 Оформить Premium", callback_data="premium_buy")]
            ])
            await message.reply(
                "⚖️ **AI Юрист Россия**\n\n"
                "📜 Гражданское, Уголовное, Трудовое право\n"
                "🏛️ Консультации по законам РФ\n"
                "📝 Помощь с документами\n\n"
                "💰 Premium: 490₽/мес\n"
                "🎁 Админ: Бесплатно",
                reply_markup=keyboard,
                parse_mode='Markdown'
            )
            return
        db.close()
    
    text = (
        "⚖️ **AI Юрист Россия**\n\n"
        "**Области права**:\n"
        "✅ Гражданское право (ГК РФ)\n"
        "✅ Уголовное право (УК РФ)\n"
        "✅ Трудовое право (ТК РФ)\n"
        "✅ Налоговое право (НК РФ)\n"
        "✅ Семейное право (СК РФ)\n"
        "✅ Административное право (КоАП РФ)\n"
        "✅ Иммиграционное право\n"
        "✅ Бизнес/Корпоративное\n\n"
        "Задайте ваш вопрос!"
    )
    
    await message.reply(text, parse_mode='Markdown')


@router.message(Command("lawyer_bg"))
async def cmd_lawyer_bg(message: types.Message):
    """
    AI Юрист Болгария
    Доступ: Premium или Admin (бесплатно)
    """
    if message.from_user.id not in config.ADMIN_IDS:
        db = crud.get_session()
        user = crud.get_user(db, message.from_user.id)
        if not (user and user.is_premium):
            db.close()
            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="💎 Оформить Premium", callback_data="premium_buy")]
            ])
            await message.reply(
                "⚖️ **AI Юрист Болгария**\n\n"
                "📜 Гражданско, Наказателно, Трудово право\n"
                "🏛️ Консултации по Bulgarian law\n"
                "📝 Помощ с документи\n\n"
                "💰 Premium: 490₽/мес\n"
                "🎁 Админ: Бесплатно",
                reply_markup=keyboard,
                parse_mode='Markdown'
            )
            return
        db.close()
    
    text = (
        "⚖️ **AI Юрист Болгария**\n\n"
        "**Области права**:\n"
        "✅ Гражданско право (ЗЗД)\n"
        "✅ Наказателно право (НК)\n"
        "✅ Трудово право (КТ)\n"
        "✅ Данъчно право (ЗКПО)\n"
        "✅ Семейно право (СК)\n"
        "✅ Имиграционно право\n"
        "✅ Бизнес право\n"
        "✅ Недвижимост\n\n"
        "Задайте вашия въпрос!"
    )
    
    await message.reply(text, parse_mode='Markdown')


@router.message(Command("lawyer_criminal"))
async def cmd_lawyer_criminal(message: types.Message):
    """
    Уголовное право (Россия + Болгария)
    """
    text = (
        "⚖️ **Уголовное право**\n\n"
        "**🇷🇺 Россия **(УК РФ)\n"
        "• Преступления против личности\n"
        "• Преступления против собственности\n"
        "• Преступления против общественной безопасности\n"
        "• Экономические преступления\n"
        "• Должностные преступления\n\n"
        "**🇧🇬 Болгария **(Наказателен кодекс)\n"
        "• Член 115: Убийство\n"
        "• Член 194: Кражба\n"
        "• Член 212: Измама\n"
        "• Член 256: Подкуп\n"
        "• Член 325: Хулиганство\n\n"
        "Задайте вопрос по уголовному праву!"
    )
    
    await message.reply(text, parse_mode='Markdown')


# ==================== AI УЧИТЕЛЬ ЯЗЫКОВ ====================

@router.message(Command("language"))
async def cmd_language(message: types.Message):
    """
    AI Учитель языков
    Доступ: Premium или Admin (бесплатно)
    """
    if message.from_user.id not in config.ADMIN_IDS:
        db = crud.get_session()
        user = crud.get_user(db, message.from_user.id)
        if not (user and user.is_premium):
            db.close()
            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="💎 Оформить Premium", callback_data="premium_buy")]
            ])
            await message.reply(
                "🗣️ **AI Учитель языков**\n\n"
                "🌍 35+ языков: English, Deutsch, Français и др.\n"
                "💬 Разговорная практика с AI\n"
                "📝 Грамматические упражнения\n"
                "🎤 Проверка произношения\n"
                "📅 Ежедневные уроки\n\n"
                "💰 Premium: 490₽/мес\n"
                "🎁 Админ: Бесплатно",
                reply_markup=keyboard,
                parse_mode='Markdown'
            )
            return
        db.close()
    
    text = (
        "🗣️ **AI Учитель языков**\n\n"
        "**Популярные языки**:\n"
        "🇬🇧 English\n"
        "🇧🇬 Български\n"
        "🇩🇪 Deutsch\n"
        "🇫🇷 Français\n"
        "🇪🇸 Español\n"
        "🇮🇹 Italiano\n"
        "🇹🇷 Türkçe\n"
        "🇨🇳 中文\n"
        "🇯🇵 日本語\n"
        "🇰🇷 한국어\n\n"
        "**Команды**:\n"
        "• `/language_start en` — Начать English\n"
        "• `/language_practice` — Практика диалога\n"
        "• `/language_grammar` — Грамматика\n"
        "• `/language_words` — Слова\n\n"
        "Выберите язык для начала!"
    )
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🇬🇧 English", callback_data="lang_en")],
        [InlineKeyboardButton(text="🇧🇬 Български", callback_data="lang_bg")],
        [InlineKeyboardButton(text="🇩🇪 Deutsch", callback_data="lang_de")],
        [InlineKeyboardButton(text="🇫🇷 Français", callback_data="lang_fr")]
    ])
    
    await message.reply(text, reply_markup=keyboard, parse_mode='Markdown')


# ==================== AI SEO ЭКСПЕРТ ====================

@router.message(Command("seo_audit"))
async def cmd_seo_audit(message: types.Message):
    """
    AI SEO Эксперт
    Доступ: Premium или Admin (бесплатно)
    """
    if message.from_user.id not in config.ADMIN_IDS:
        db = crud.get_session()
        user = crud.get_user(db, message.from_user.id)
        if not (user and user.is_premium):
            db.close()
            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="💎 Оформить Premium", callback_data="premium_buy")]
            ])
            await message.reply(
                "🔍 **AI SEO Эксперт**\n\n"
                "📊 Аудит сайта\n"
                "🔑 Подбор ключевых слов\n"
                "📝 Оптимизация контента\n"
                "📈 Рекомендации по продвижению\n\n"
                "💰 Premium: 990₽/мес\n"
                "🎁 Админ: Бесплатно",
                reply_markup=keyboard,
                parse_mode='Markdown'
            )
            return
        db.close()
    
    text = (
        "🔍 **AI SEO Эксперт**\n\n"
        "**Возможности**:\n"
        "✅ SEO аудит сайта\n"
        "✅ Подбор ключевых слов\n"
        "✅ Оптимизация мета-тегов\n"
        "✅ Анализ конкурентов\n"
        "✅ Рекомендации по контенту\n"
        "✅ Технический SEO аудит\n\n"
        "Отправьте URL сайта для аудита!"
    )
    
    await message.reply(text, parse_mode='Markdown')


# ==================== AI ЖУРНАЛИСТ ====================

@router.message(Command("journalist"))
async def cmd_journalist(message: types.Message):
    """
    AI Журналист
    Доступ: Premium или Admin (бесплатно)
    """
    if message.from_user.id not in config.ADMIN_IDS:
        db = crud.get_session()
        user = crud.get_user(db, message.from_user.id)
        if not (user and user.is_premium):
            db.close()
            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="💎 Оформить Premium", callback_data="premium_buy")]
            ])
            await message.reply(
                "📰 **AI Журналист**\n\n"
                "✍️ Написание статей\n"
                "📝 Пресс-релизы\n"
                "📢 Посты для соцсетей\n"
                "🎯 Контент для каналов\n\n"
                "💰 Premium: 990₽/мес\n"
                "🎁 Админ: Бесплатно",
                reply_markup=keyboard,
                parse_mode='Markdown'
            )
            return
        db.close()
    
    text = (
        "📰 **AI Журналист**\n\n"
        "**Типы контента**:\n"
        "✅ Новостные статьи\n"
        "✅ Пресс-релизы\n"
        "✅ Посты для Telegram\n"
        "✅ Статьи для Яндекс.Дзен\n"
        "✅ Блоги и обзоры\n\n"
        "Отправьте тему для статьи!"
    )
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📝 Новость", callback_data="journalist_news")],
        [InlineKeyboardButton(text="📢 Пресс-релиз", callback_data="journalist_press")],
        [InlineKeyboardButton(text="📱 Telegram пост", callback_data="journalist_telegram")],
        [InlineKeyboardButton(text="📄 Статья", callback_data="journalist_article")]
    ])
    
    await message.reply(text, reply_markup=keyboard, parse_mode='Markdown')


# ==================== AI ЭКСПЕРТ (КАНАЛЫ) ====================

@router.message(Command("expert"))
async def cmd_expert(message: types.Message):
    """
    AI Эксперт для каналов
    """
    text = (
        "🎯 **AI Эксперт** — контент для каналов\n\n"
        "**Категории**:\n"
        "🤖 AI и нейросети\n"
        "💰 Инвестиции\n"
        "₿ Криптовалюты\n"
        "🏢 Бизнес\n"
        "🎓 Образование\n\n"
        "Отправьте тему для поста!"
    )
    
    await message.reply(text, parse_mode='Markdown')


# ==================== ОТСЛЕЖИВАНИЕ ДЕЛ ====================

@router.message(Command("criminal_track"))
async def cmd_criminal_track(message: types.Message):
    """
    Отслеживание уголовных дел
    """
    text = (
        "⚖️ **Отслеживание уголовных дел**\n\n"
        "**Источники**:\n"
        "🇷🇺 Россия:\n"
        "• ГАС Правосудие\n"
        "• Картотека арбитражных дел\n"
        "• Росправосудие\n\n"
        "🇧🇬 Болгария:\n"
        "• Портал на съдебната власт\n"
        "• Върховен касационен съд\n\n"
        "**Команды**:\n"
        "• `/criminal_search [ФИО]` — Поиск дел\n"
        "• `/criminal_case [номер]` — Детали дела\n"
        "• `/criminal_alerts` — Уведомления\n\n"
        "Введите ФИО для поиска!"
    )
    
    await message.reply(text, parse_mode='Markdown')
