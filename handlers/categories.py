"""
Хэндлеры для категорий знаний
Школа, Вуз, Сад, AI, Premium, Инвест, Крипта, Бизнес, Погода, Инфляция
"""
import logging
from aiogram import Router, F, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from sqlalchemy.orm import Session

from core.ai_client import OpenRouterClient
from core.rag import RAGRetriever
from core.real_data import RealTimeData
from prompts import SYSTEM_PROMPT, USER_REPLY_PROMPT
from database import crud
from config import config

logger = logging.getLogger(__name__)

router = Router()
# Инициализация real_time_data без API ключа (работает с дефолтными данными)
real_time_data = RealTimeData(None)


# ==================== КАТЕГОРИИ ====================

@router.message(Command("categories"))
async def cmd_categories(message: types.Message):
    """Показать все категории знаний"""
    text = (
        "📚 **Категории знаний**:\n\n"
        "Выберите интересующую вас категорию:"
    )

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🎓 Образование", callback_data="cat_education")],
        [InlineKeyboardButton(text="🤖 Искусственный Интеллект", callback_data="cat_ai")],
        [InlineKeyboardButton(text="💰 Инвестиции", callback_data="cat_invest")],
        [InlineKeyboardButton(text="₿ Криптовалюты", callback_data="cat_crypto")],
        [InlineKeyboardButton(text="🏢 Бизнес", callback_data="cat_business")],
        [InlineKeyboardButton(text="🌤️ Погода", callback_data="cat_weather")],
        [InlineKeyboardButton(text="📈 Инфляция", callback_data="cat_inflation")],
        [InlineKeyboardButton(text="🎁 Premium", callback_data="cat_premium")],
    ])

    await message.reply(text, reply_markup=keyboard, parse_mode='Markdown')


# ==================== ОБРАЗОВАНИЕ ====================

@router.message(Command("education"))
async def cmd_education(message: types.Message, ai_client: OpenRouterClient, rag: RAGRetriever):
    """Команда /education - вопросы по образованию"""
    text = (
        "🎓 **Образование** — Школа, Вуз, Детский сад\n\n"
        "Задайте ваш вопрос по образованию:\n\n"
        "📌 *Примеры вопросов:*\n"
        "• Как подготовиться к ЕГЭ?\n"
        "• Какие вузы лучшие для IT?\n"
        "• Как записать ребёнка в детский сад?\n"
        "• Что такое семейное образование?\n"
        "• Как поступить в зарубежный вуз?"
    )

    await message.reply(text, parse_mode='Markdown')


# ==================== AI ====================

@router.message(Command("ai"))
async def cmd_ai(message: types.Message, ai_client: OpenRouterClient, rag: RAGRetriever):
    """Команда /ai - вопросы про искусственный интеллект"""
    text = (
        "🤖 **Искусственный Интеллект**\n\n"
        "Задайте ваш вопрос про AI:\n\n"
        "📌 *Примеры вопросов:*\n"
        "• Что такое машинное обучение?\n"
        "• Как работает GPT?\n"
        "• Какие есть AI-инструменты?\n"
        "• Что такое нейронные сети?\n"
        "• Как начать карьеру в AI?"
    )

    await message.reply(text, parse_mode='Markdown')


# ==================== ИНВЕСТИЦИИ ====================

@router.message(Command("invest"))
async def cmd_invest(message: types.Message, ai_client: OpenRouterClient, rag: RAGRetriever):
    """Команда /invest - вопросы по инвестициям"""
    # Получаем актуальные данные
    moex_data = await real_time_data.get_moex_stocks()
    crypto_data = await real_time_data.get_crypto_rates()
    inflation_data = await real_time_data.get_inflation_data()

    # Формируем текст с реальными данными
    moex_top = moex_data[:5] if moex_data else []
    crypto_top = crypto_data[:5] if crypto_data else []

    moex_text = ""
    for stock in moex_top:
        change_sign = "+" if stock.get('change', 0) >= 0 else ""
        moex_text += f"{stock['ticker']}: {stock['last']:.2f}₽ ({change_sign}{stock.get('change', 0):.1f}%)\n"

    crypto_text = ""
    for coin in crypto_top:
        change_sign = "+" if coin.get('change_24h', 0) >= 0 else ""
        crypto_text += f"{coin['symbol']}: ${coin['price_usd']:,.2f} ({change_sign}{coin.get('change_24h', 0):.1f}%)\n"

    text = (
        "💰 **Инвестиции** — Фондовый рынок, MOEX\n\n"
        "📊 **Топ акций MOEX**:\n"
        f"{moex_text}\n" if moex_text else "Данные загружаются...\n\n"
        
        "₿ **Топ криптовалют**:\n"
        f"{crypto_text}\n" if crypto_text else "Данные загружаются...\n\n"
        
        f"📈 **Инфляция в РФ**: {inflation_data.get('current', 0)}%\n\n"
        
        "Задайте ваш вопрос по инвестициям:\n\n"
        "📌 *Примеры вопросов:*\n"
        "• Как начать инвестировать?\n"
        "• Какие акции купить?\n"
        "• Что такое ИИС?\n"
        "• Как диверсифицировать портфель?\n"
        "• Какие риски у инвестиций?"
    )

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📊 Рекомендации", callback_data="invest_recommendations")],
        [InlineKeyboardButton(text="📈 MOEX котировки", callback_data="invest_moex")],
        [InlineKeyboardButton(text="💡 Основы инвестирования", callback_data="invest_basics")],
    ])

    await message.reply(text, reply_markup=keyboard, parse_mode='Markdown')


# ==================== КРИПТОВАЛЮТЫ ====================

@router.message(Command("crypto"))
async def cmd_crypto(message: types.Message, ai_client: OpenRouterClient, rag: RAGRetriever):
    """Команда /crypto - вопросы по криптовалютам"""
    # Получаем актуальные данные
    crypto_data = await real_time_data.get_crypto_rates()
    web3_data = await real_time_data.get_web3_projects()

    # Формируем текст
    crypto_top = crypto_data[:10] if crypto_data else []

    crypto_text = ""
    for coin in crypto_top:
        change_sign = "+" if coin.get('change_24h', 0) >= 0 else ""
        crypto_text += f"{coin['symbol']}: ${coin['price_usd']:,.2f} ({change_sign}{coin.get('change_24h', 0):.1f}%)\n"

    text = (
        "₿ **Криптовалюты и Web3**\n\n"
        "📊 **Курсы криптовалют**:\n"
        f"{crypto_text}\n\n" if crypto_text else "Данные загружаются...\n\n"
        
        "Задайте ваш вопрос по криптовалютам:\n\n"
        "📌 *Примеры вопросов:*\n"
        "• Что такое блокчейн?\n"
        "• Как купить биткоин?\n"
        "• Что такое DeFi?\n"
        "• Какие Web3 проекты перспективны?\n"
        "• Как хранить криптовалюту безопасно?"
    )

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔮 Web3 проекты", callback_data="crypto_web3")],
        [InlineKeyboardButton(text="📚 Основы крипты", callback_data="crypto_basics")],
        [InlineKeyboardButton(text="🛡️ Безопасность", callback_data="crypto_security")],
    ])

    await message.reply(text, reply_markup=keyboard, parse_mode='Markdown')


# ==================== БИЗНЕС ====================

@router.message(Command("business"))
async def cmd_business(message: types.Message, ai_client: OpenRouterClient, rag: RAGRetriever):
    """Команда /business - вопросы по бизнесу"""
    text = (
        "🏢 **Бизнес** — Предпринимательство, управление\n\n"
        "Задайте ваш вопрос по бизнесу:\n\n"
        "📌 *Примеры вопросов:*\n"
        "• Как открыть ИП или ООО?\n"
        "• Какую систему налогообложения выбрать?\n"
        "• Как найти первых клиентов?\n"
        "• Как составить бизнес-план?\n"
        "• Что такое франшиза?"
    )

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📝 Регистрация бизнеса", callback_data="business_registration")],
        [InlineKeyboardButton(text="💰 Налоги", callback_data="business_taxes")],
        [InlineKeyboardButton(text="📈 Маркетинг", callback_data="business_marketing")],
        [InlineKeyboardButton(text="🎯 Франшизы", callback_data="business_franchise")],
    ])

    await message.reply(text, reply_markup=keyboard, parse_mode='Markdown')


# ==================== ПОГОДА ====================

@router.message(Command("weather"))
async def cmd_weather(message: types.Message, ai_client: OpenRouterClient, rag: RAGRetriever):
    """Команда /weather - погода в городах"""
    text = (
        "🌤️ **Погода** — Прогнозы по городам России и мира\n\n"
        "Напишите город для получения погоды:\n\n"
        "📌 *Примеры:*\n"
        "• Москва\n"
        "• Санкт-Петербург\n"
        "• Сочи\n"
        "• Дубай\n"
        "• Токио\n\n"
        "Или выберите из популярных:"
    )

    # Популярные города
    popular_cities = ["Москва", "Санкт-Петербург", "Сочи", "Казань", "Дубай"]

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=city, callback_data=f"weather_{city.lower()}") for city in popular_cities[:3]],
        [InlineKeyboardButton(text=city, callback_data=f"weather_{city.lower()}") for city in popular_cities[3:]],
        [InlineKeyboardButton(text="🌍 Все города России", callback_data="weather_russia")],
        [InlineKeyboardButton(text="🌎 Зарубежные города", callback_data="weather_world")],
    ])

    await message.reply(text, reply_markup=keyboard, parse_mode='Markdown')


# ==================== ИНФЛЯЦИЯ ====================

@router.message(Command("inflation"))
async def cmd_inflation(message: types.Message, ai_client: OpenRouterClient, rag: RAGRetriever):
    """Команда /inflation - данные об инфляции"""
    # Получаем актуальные данные
    inflation_data = await real_time_data.get_inflation_data()
    economic_data = await real_time_data.get_economic_indicators()

    text = (
        "📈 **Инфляция и Экономика**\n\n"
        
        f"🇷🇺 **Инфляция в России**: {inflation_data.get('current', 0)}%\n"
        f"   • Прошлый год: {inflation_data.get('previous', 0)}%\n"
        f"   • Цель ЦБ: {inflation_data.get('target', 0)}%\n"
        f"   • Прогноз: {inflation_data.get('forecast_next_year', 0)}%\n\n"
        
        f"💰 **Ключевая ставка**: {economic_data.get('russia', {}).get('interest_rate', 0)}%\n"
        f"📊 **ВВП рост**: {economic_data.get('russia', {}).get('gdp_growth', 0)}%\n"
        f"👷 **Безработица**: {economic_data.get('russia', {}).get('unemployment', 0)}%\n\n"
        
        "Задайте ваш вопрос об инфляции:\n\n"
        "📌 *Примеры вопросов:*\n"
        "• Как защититься от инфляции?\n"
        "• Почему растёт инфляция?\n"
        "• Что делает ЦБ для борьбы с инфляцией?\n"
        "• Как инфляция влияет на сбережения?"
    )

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="💡 Как защититься", callback_data="inflation_protection")],
        [InlineKeyboardButton(text="📊 Инфляция по странам", callback_data="inflation_world")],
        [InlineKeyboardButton(text="📈 Прогнозы", callback_data="inflation_forecast")],
    ])

    await message.reply(text, reply_markup=keyboard, parse_mode='Markdown')


# ==================== PREMIUM ====================

@router.message(Command("premium"))
async def cmd_premium(message: types.Message):
    """Команда /premium - премиум возможности"""
    text = (
        "🎁 **Premium подписка**\n\n"
        
        "🌟 **Эксклюзивные возможности**:\n\n"
        
        "✅ **Персональные рекомендации**\n"
        "   • Индивидуальный инвестиционный портфель\n"
        "   • Персональная образовательная траектория\n"
        "   • Рекомендации по карьере\n\n"
        
        "✅ **Приоритетная поддержка**\n"
        "   • Ответы в течение 1 часа\n"
        "   • Персональный менеджер\n"
        "   • Прямая связь с разработчиками\n\n"
        
        "✅ **Эксклюзивный контент**\n"
        "   • Закрытые вебинары\n"
        "   • Ранний доступ к новым функциям\n"
        "   • Премиум аналитика\n\n"
        
        "✅ **Расширенные лимиты**\n"
        "   • Больше запросов в день\n"
        "   • Приоритет в обработке\n"
        "   • Расширенная история диалогов\n\n"
        
        "💳 **Стоимость**:\n"
        "   • 990₽ / месяц\n"
        "   • 2 490₽ / 3 месяца\n"
        "   • 7 990₽ / год\n\n"
        
        "📩 Для подключения напишите @admin"
    )

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="💳 Оформить подписку", callback_data="premium_buy")],
        [InlineKeyboardButton(text="❓ Узнать подробнее", callback_data="premium_info")],
    ])

    await message.reply(text, reply_markup=keyboard, parse_mode='Markdown')


# ==================== CALLBACK QUERY (ИНВЕСТИЦИИ) ====================

@router.callback_query(F.data == "invest_recommendations")
async def cb_invest_recommendations(callback: types.CallbackQuery, ai_client: OpenRouterClient, rag: RAGRetriever):
    """Рекомендации по инвестициям"""
    # Получаем данные для рекомендаций
    recommendations = await real_time_data.get_investment_recommendations(
        risk_profile='medium',
        amount=100000
    )

    text = (
        "💡 **Инвестиционные рекомендации**\n\n"
        
        "📊 **Рекомендуемое распределение**:\n"
        f"   • Акции: {recommendations['portfolio']['stocks']*100:.0f}%\n"
        f"   • Облигации: {recommendations['portfolio']['bonds']*100:.0f}%\n"
        f"   • Золото: {recommendations['portfolio']['gold']*100:.0f}%\n"
        f"   • Крипто: {recommendations['portfolio']['crypto']*100:.0f}%\n\n"
        
        "🔝 **Топ акций для рассмотрения**:\n"
    )

    for stock in recommendations['top_stocks'][:3]:
        text += f"   • {stock['ticker']}: {stock['last']:.2f}₽\n"

    text += "\n⚠️ *Это не индивидуальная рекомендация. Проведите собственный анализ.*"

    await callback.message.edit_text(text, parse_mode='Markdown')


@router.callback_query(F.data == "invest_moex")
async def cb_invest_moex(callback: types.CallbackQuery):
    """Котировки MOEX"""
    moex_data = await real_time_data.get_moex_stocks()
    moex_index = await real_time_data.get_moex_index()

    text = f"📈 **Индекс Мосбиржи**: {moex_index['value']:.2f} ({moex_index['change']:+.2f}%)\n\n"
    text += "**Котировки акций**:\n\n"

    for stock in moex_data:
        change_sign = "+" if stock.get('change', 0) >= 0 else ""
        text += f"{stock['ticker']}: {stock['last']:.2f}₽ ({change_sign}{stock.get('change', 0):.1f}%)\n"

    await callback.message.edit_text(text, parse_mode='Markdown')


@router.callback_query(F.data == "invest_basics")
async def cb_invest_basics(callback: types.CallbackQuery, ai_client: OpenRouterClient, rag: RAGRetriever):
    """Основы инвестирования"""
    query = "Как начать инвестировать с нуля пошаговая инструкция"
    rag_context = rag.retrieve(query)

    user_message = f"[ACTION: USER_REPLY]\n{query}"
    if rag_context:
        user_message += f"\n\n[RAG_CONTEXT]\n{rag_context}"

    response = await ai_client.complete(
        system=USER_REPLY_PROMPT,
        user=user_message,
        mode="fast"
    )

    await callback.message.edit_text(response, parse_mode='Markdown')


# ==================== CALLBACK QUERY (КРИПТА) ====================

@router.callback_query(F.data == "crypto_web3")
async def cb_crypto_web3(callback: types.CallbackQuery):
    """Web3 проекты"""
    web3_data = await real_time_data.get_web3_projects()

    text = "🔮 **Перспективные Web3 проекты**\n\n"

    categories_map = {
        'layer1': "📡 Layer 1 (Базовые блокчейны)",
        'layer2': "⚡ Layer 2 (Масштабирование)",
        'defi': "💰 DeFi",
        'gaming': "🎮 Gaming",
        'infrastructure': "🏗️ Инфраструктура"
    }

    for category, projects in web3_data.items():
        if projects:
            text += f"\n{categories_map.get(category, category)}:\n"
            for project in projects[:5]:
                change_sign = "+" if project.get('change_24h', 0) >= 0 else ""
                text += f"   • {project['id']}: ${project['price_usd']:.4f} ({change_sign}{project.get('change_24h', 0):.1f}%)\n"

    await callback.message.edit_text(text, parse_mode='Markdown')


# ==================== CALLBACK QUERY (ПОГОДА) ====================

@router.callback_query(F.data.startswith("weather_"))
async def cb_weather_city(callback: types.CallbackQuery):
    """Погода в городе"""
    city = callback.data.replace("weather_", "").capitalize()

    # Особые случаи
    if city == "Russia":
        cities = ["Москва", "Санкт-Петербург", "Казань", "Сочи", "Екатеринбург"]
        weather_data = await real_time_data.get_weather_multiple_cities(cities)

        text = "🌤️ **Погода в городах России**\n\n"
        for city_name, data in weather_data.items():
            if 'error' not in data:
                text += f"📍 **{city_name}**: {data['temp']:+.0f}°C, {data['description']}\n"
                text += f"   Ощущается как: {data['feels_like']:+.0f}°C, влажность {data['humidity']}%\n\n"
    elif city == "World":
        cities = ["Дубай", "Токио", "Нью-Йорк", "Лондон", "Париж"]
        weather_data = await real_time_data.get_weather_multiple_cities(cities)

        text = "🌍 **Погода в зарубежных городах**\n\n"
        for city_name, data in weather_data.items():
            if 'error' not in data:
                text += f"📍 **{city_name}**: {data['temp']:+.0f}°C, {data['description']}\n"
                text += f"   Ощущается как: {data['feels_like']:+.0f}°C\n\n"
    else:
        weather_data = await real_time_data.get_weather(city)

        if 'error' in weather_data:
            text = f"❌ {weather_data['error']}"
        else:
            text = (
                f"🌤️ **Погода в городе {weather_data['city']}**\n\n"
                f"🌡️ Температура: {weather_data['temp']:+.0f}°C\n"
                f"   Ощущается как: {weather_data['feels_like']:+.0f}°C\n"
                f"☁️ {weather_data['description'].capitalize()}\n"
                f"💧 Влажность: {weather_data['humidity']}%\n"
                f"💨 Ветер: {weather_data['wind_speed']} м/с\n"
                f"📊 Давление: {weather_data['pressure']} мм рт.ст.\n"
            )

    await callback.message.edit_text(text, parse_mode='Markdown')


# ==================== ОБРАБОТКА СООБЩЕНИЙ ПО КАТЕГОРИЯМ ====================

@router.message()
async def handle_category_message(message: types.Message, ai_client: OpenRouterClient, rag: RAGRetriever):
    """
    Обработка сообщений в контексте категорий
    Если пользователь задал вопрос после выбора категории
    """
    # Проверяем, есть ли контекст категории
    db = crud.get_session()
    context = crud.get_conversation_context(db, message.from_user.id) or []
    db.close()

    # Определяем категорию по контексту
    category = None
    for msg in reversed(context[-4:]):
        content = msg.get('content', '')
        if 'инвест' in content.lower() or 'акци' in content.lower():
            category = 'invest'
        elif 'крипт' in content.lower() or 'битко' in content.lower():
            category = 'crypto'
        elif 'погод' in content.lower():
            category = 'weather'
        elif 'бизнес' in content.lower():
            category = 'business'
        elif 'образован' in content.lower() or 'школ' in content.lower() or 'вуз' in content.lower():
            category = 'education'
        elif 'инфляц' in content.lower():
            category = 'inflation'
        elif 'ai' in content.lower() or 'искусственн' in content.lower():
            category = 'ai'

    # Если категория определена, используем соответствующий промпт
    if category:
        # Получаем реальные данные если нужно
        real_data = ""

        if category == 'weather':
            # Пытаемся извлечь город из сообщения
            cities = ["москва", "санкт-петербург", "сочи", "казань", "дубай", "токио"]
            for city in cities:
                if city in message.text.lower():
                    weather = await real_time_data.get_weather(city.capitalize())
                    if 'error' not in weather:
                        real_data = f"\n\n[WEATHER DATA]\n{weather['city']}: {weather['temp']}°C, {weather['description']}"
                    break

        elif category == 'invest':
            moex = await real_time_data.get_moex_stocks()
            crypto = await real_time_data.get_crypto_rates()
            real_data = f"\n\n[MOEX DATA]\n{moex[:5]}\n\n[CRYPTO DATA]\n{crypto[:5]}"

        elif category == 'crypto':
            crypto = await real_time_data.get_crypto_rates()
            web3 = await real_time_data.get_web3_projects()
            real_data = f"\n\n[CRYPTO DATA]\n{crypto[:10]}\n\n[WEB3 DATA]\n{web3}"

        elif category == 'inflation':
            inflation = await real_time_data.get_inflation_data()
            real_data = f"\n\n[INFLATION DATA]\n{inflation}"

        # Формируем запрос с контекстом
        user_message = f"[ACTION: USER_REPLY]\n{message.text}"
        if real_data:
            user_message += real_data

        # RAG-поиск
        rag_context = rag.retrieve(message.text)
        if rag_context:
            user_message += f"\n\n[RAG_CONTEXT]\n{rag_context}"

        # Ответ от AI
        response = await ai_client.complete(
            system=USER_REPLY_PROMPT,
            user=user_message,
            mode="fast" if len(message.text) < 100 else "heavy"
        )

        await message.reply(response, parse_mode='Markdown')
        return

    # Если категория не определена — стандартная обработка
    # (будет обработано в handlers/user.py)
