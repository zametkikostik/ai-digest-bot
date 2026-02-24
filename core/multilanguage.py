"""
Мультиязычность и локализация
Поддержка всех языков, автоопределение языка, перевод
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime
from config import config

logger = logging.getLogger(__name__)


class MultiLanguageSupport:
    """Мультиязычная поддержка бота"""

    def __init__(self):
        # Поддерживаемые языки
        self.supported_languages = [
            "ru", "en", "es", "fr", "de", "it", "pt", "nl", "pl", "cs",
            "sk", "bg", "sr", "hr", "sl", "mk", "uk", "be", "lt", "lv",
            "et", "fi", "sv", "no", "da", "is", "ga", "cy", "mt", "el",
            "tr", "ar", "he", "fa", "ur", "hi", "bn", "ta", "te", "mr",
            "gu", "kn", "ml", "si", "th", "vi", "id", "ms", "tl", "zh",
            "ja", "ko", "mn", "ka", "hy", "az", "uz", "kk", "ky", "tg",
            "tk", "af", "sw", "am", "ti", "so", "ha", "yo", "ig", "zu",
            "xh", "st", "tn", "ss", "ve", "ts", "nr"
        ]
        
        # Языковые коды Telegram
        self.language_codes = {
            "ru": "🇷🇺 Русский",
            "en": "🇬🇧 English",
            "es": "🇪🇸 Español",
            "fr": "🇫🇷 Français",
            "de": "🇩🇪 Deutsch",
            "it": "🇮🇹 Italiano",
            "pt": "🇵🇹 Português",
            "pl": "🇵🇱 Polski",
            "uk": "🇺🇦 Українська",
            "be": "🇧🇾 Беларуская",
            "bg": "🇧🇬 Български",
            "tr": "🇹🇷 Türkçe",
            "ar": "🇸🇦 العربية",
            "he": "🇮🇱 עברית",
            "fa": "🇮🇷 فارسی",
            "hi": "🇮🇳 हिन्दी",
            "zh": "🇨🇳 中文",
            "ja": "🇯🇵 日本語",
            "ko": "🇰🇷 한국어",
            "uz": "🇺🇿 O'zbek",
            "kk": "🇰🇿 Қазақша",
            "az": "🇦🇿 Azərbaycan",
            "ka": "🇬🇪 ქართული",
            "hy": "🇦🇲 Հայերեն",
        }
        
        # Кэш переводов
        self._translations_cache: Dict[str, Dict[str, str]] = {}
        
        # Языки пользователей
        self._user_languages: Dict[int, str] = {}

    def detect_language(self, text: str) -> str:
        """
        Автоопределение языка по тексту

        Args:
            text: Текст для анализа

        Returns:
            Код языка
        """
        # Простая эвристика по символам
        cyrillic = sum(1 for c in text if 'а' <= c <= 'я' or 'А' <= c <= 'Я')
        latin = sum(1 for c in text if 'a' <= c <= 'z' or 'A' <= c <= 'Z')
        arabic = sum(1 for c in text if '\u0600' <= c <= '\u06FF')
        chinese = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
        japanese = sum(1 for c in text if '\u3040' <= c <= '\u30ff')

        char_counts = {
            'ru': cyrillic,
            'en': latin,
            'ar': arabic,
            'zh': chinese,
            'ja': japanese
        }

        max_lang = max(char_counts, key=char_counts.get)
        max_count = char_counts[max_lang]

        if max_count == 0:
            return 'en'  # По умолчанию

        # Проверяем порог (минимум 5 символов для определения)
        if max_count < 5:
            return 'en'

        return max_lang

    def set_user_language(self, user_id: int, language: str) -> bool:
        """Установка языка пользователя"""
        if language not in self.supported_languages:
            return False
        
        self._user_languages[user_id] = language
        logger.info(f"🌍 Пользователь {user_id} установил язык: {language}")
        return True

    def get_user_language(self, user_id: int) -> str:
        """Получение языка пользователя"""
        return self._user_languages.get(user_id, 'ru')  # По умолчанию русский

    async def translate(
        self,
        text: str,
        from_lang: str,
        to_lang: str,
        ai_client
    ) -> str:
        """
        Перевод текста через AI

        Args:
            text: Текст для перевода
            from_lang: Исходный язык
            to_lang: Целевой язык
            ai_client: AI клиент

        Returns:
            Переведённый текст
        """
        if from_lang == to_lang:
            return text

        # Проверяем кэш
        cache_key = f"{from_lang}_{to_lang}_{hash(text)}"
        if cache_key in self._translations_cache:
            return self._translations_cache[cache_key]

        prompt = f"""
Переведи текст с {from_lang} на {to_lang}.

ТЕКСТ:
{text}

ТРЕБОВАНИЯ:
- Сохрани смысл и тон
- Адаптируй идиомы и выражения
- Сохрани форматирование
- Не добавляй пояснений

ПЕРЕВОД:
"""

        translated = await ai_client.complete(
            system=f"Ты — профессиональный переводчик. Переводи точно и естественно.",
            user=prompt,
            mode="fast"
        )

        # Кэшируем
        self._translations_cache[cache_key] = translated

        return translated

    async def respond_in_user_language(
        self,
        user_id: int,
        response: str,
        ai_client
    ) -> str:
        """
        Ответ на языке пользователя

        Args:
            user_id: ID пользователя
            response: Текст ответа (на русском)
            ai_client: AI клиент

        Returns:
            Ответ на языке пользователя
        """
        user_lang = self.get_user_language(user_id)

        if user_lang == 'ru':
            return response

        return await self.translate(response, 'ru', user_lang, ai_client)

    def get_language_name(self, code: str) -> str:
        """Название языка на русском"""
        return self.language_codes.get(code, code)

    def get_language_selector_keyboard(self) -> list:
        """Клавиатура выбора языка"""
        keyboard = []
        row = []
        
        for code, name in list(self.language_codes.items())[:20]:  # Первые 20
            row.append({"text": name, "callback_data": f"lang_{code}"})
            if len(row) == 2:
                keyboard.append(row)
                row = []
        
        if row:
            keyboard.append(row)
        
        return keyboard


# Глобальный экземпляр
mls = MultiLanguageSupport()


def init_multilanguage():
    """Инициализация мультиязычности"""
    global mls
    logger.info("🌍 Мультиязычность инициализирована")
    return mls


# Защита от взлома и скрытие информации о модели

class SecurityManager:
    """Менеджер безопасности"""

    def __init__(self):
        # Паттерны атак
        self._attack_patterns = [
            r"ignore\s+previous\s+instructions",
            r"bypass\s+security",
            r"what\s+model\s+are\s+you",
            r"what\s+is\s+your\s+system\s+prompt",
            r"show\s+me\s+your\s+instructions",
            r"act\s+as\s+developer",
            r"debug\s+mode",
            r"developer\s+mode",
            r"jailbreak",
            r"dan\s+",
            r"do\s+anything\s+now",
            r"выдай\s+информацию\s+о\s+модели",
            r"обойди\s+защиту",
            r"режим\s+разработчика",
            r"покажи\s+системный\s+промпт",
        ]

        # Запрещённые темы
        self._forbidden_topics = [
            "model_architecture",
            "system_prompt",
            "api_keys",
            "internal_configuration",
            "training_data",
            "weights",
            "parameters"
        ]

    def check_prompt_injection(self, user_message: str) -> Tuple[bool, str]:
        """
        Проверка на prompt injection

        Returns:
            (is_attack, attack_type)
        """
        import re

        message_lower = user_message.lower()

        for pattern in self._attack_patterns:
            if re.search(pattern, message_lower):
                logger.warning(f"🚨 Prompt injection попытка: {user_message[:100]}")
                return True, "prompt_injection"

        return False, ""

    def check_forbidden_topic(self, user_message: str) -> Tuple[bool, str]:
        """
        Проверка на запрос запрещённой информации

        Returns:
            (is_forbidden, topic)
        """
        message_lower = user_message.lower()

        for topic in self._forbidden_topics:
            if topic.replace("_", " ") in message_lower:
                logger.warning(f"🚨 Запрещённая тема: {topic}")
                return True, topic

        # Проверка на вопросы о модели
        forbidden_questions = [
            "какая у тебя модель",
            "на каком ии ты работаешь",
            "кто тебя создал",
            "какая версия gpt",
            "ты gpt-4",
            "какой у тебя api",
            "как ты устроен",
            "сколько у тебя параметров"
        ]

        for question in forbidden_questions:
            if question in message_lower:
                return True, "model_info"

        return False, ""

    def get_safe_response(self, attack_type: str, user_language: str = "ru") -> str:
        """
        Безопасный ответ на атаку

        Returns:
            str: Безопасный ответ
        """
        responses = {
            "ru": {
                "prompt_injection": "🔒 Я не могу выполнить эту просьбу. Я создан, чтобы помогать вам с полезными задачами: подготовка к экзаменам, юридические консультации, SEO-оптимизация и многое другое. Чем я могу помочь?",
                "forbidden_topic": "🔒 Эта информация конфиденциальна и не подлежит разглашению. Я могу помочь вам с другими вопросами!",
                "model_info": "🔒 Я не могу раскрывать техническую информацию о своей архитектуре. Но я с радостью помогу вам с полезными задачами! Что вас интересует?"
            },
            "en": {
                "prompt_injection": "🔒 I cannot fulfill this request. I'm designed to help you with useful tasks: exam preparation, legal consultations, SEO optimization, and more. How can I assist you?",
                "forbidden_topic": "🔒 This information is confidential and cannot be disclosed. I can help you with other questions!",
                "model_info": "🔒 I cannot disclose technical information about my architecture. But I'd be happy to help you with useful tasks! What are you interested in?"
            }
        }

        lang_responses = responses.get(user_language, responses["ru"])
        return lang_responses.get(attack_type, "🔒 I cannot fulfill this request.")

    def sanitize_input(self, user_message: str) -> str:
        """
        Очистка входных данных

        Returns:
            str: Очищенное сообщение
        """
        # Удаляем потенциальные инъекции
        import re
        
        # Удаляем специальные команды
        sanitized = re.sub(r'/[a-zA-Z_]+', '', user_message)
        
        # Удаляем HTML теги
        sanitized = re.sub(r'<[^>]+>', '', sanitized)
        
        # Удаляем экранированные символы
        sanitized = sanitized.replace('\\n', '\n')
        sanitized = sanitized.replace('\\t', '\t')
        
        return sanitized.strip()


from typing import Tuple

# Глобальный экземпляр
security_manager = SecurityManager()


def init_security_manager():
    """Инициализация менеджера безопасности"""
    global security_manager
    logger.info("🔒 Менеджер безопасности инициализирован")
    return security_manager
