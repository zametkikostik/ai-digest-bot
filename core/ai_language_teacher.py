"""
AI Учитель иностранных языков
Изучение языков в реальном времени с обратной связью
Поддержка всех языков включая болгарский
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
from config import config

logger = logging.getLogger(__name__)


class LanguageLevel(Enum):
    """Уровни владения языком"""
    A1 = "A1"  # Beginner
    A2 = "A2"  # Elementary
    B1 = "B1"  # Intermediate
    B2 = "B2"  # Upper Intermediate
    C1 = "C1"  # Advanced
    C2 = "C2"  # Proficiency


@dataclass
class LanguageCourse:
    """Языковой курс"""
    language: str
    level: LanguageLevel
    lessons_completed: int
    total_lessons: int
    words_learned: int
    last_practice: datetime
    streak_days: int


@dataclass
class PracticeSession:
    """Сессия практики"""
    user_id: int
    language: str
    exercise_type: str
    questions: List[Dict]
    answers: List[Dict]
    score: float
    feedback: str
    timestamp: datetime


class AILanguageTeacher:
    """AI Учитель иностранных языков"""

    def __init__(self, ai_client):
        self.ai_client = ai_client
        self._courses: Dict[int, Dict[str, LanguageCourse]] = {}
        self._practice_sessions: List[PracticeSession] = []
        
        # Поддерживаемые языки
        self.supported_languages = [
            "en", "bg", "de", "fr", "es", "it", "pt", "pl", "cs", "sk",
            "uk", "be", "ru", "tr", "ar", "he", "fa", "hi", "zh", "ja",
            "ko", "vi", "th", "id", "ms", "nl", "sv", "no", "da", "fi",
            "el", "hu", "ro", "sr", "hr", "sl", "mk", "sq", "lt", "lv", "et"
        ]
        
        # Языковые названия
        self.language_names = {
            "en": "English 🇬🇧",
            "bg": "Български 🇧🇬",
            "de": "Deutsch 🇩🇪",
            "fr": "Français 🇫🇷",
            "es": "Español 🇪🇸",
            "it": "Italiano 🇮🇹",
            "pt": "Português 🇵🇹",
            "pl": "Polski 🇵🇱",
            "uk": "Українська 🇺🇦",
            "be": "Беларуская 🇧🇾",
            "ru": "Русский 🇷🇺",
            "tr": "Türkçe 🇹🇷",
            "ar": "العربية 🇸🇦",
            "he": "עברית 🇮🇱",
            "zh": "中文 🇨🇳",
            "ja": "日本語 🇯🇵",
            "ko": "한국어 🇰🇷",
        }

    async def start_course(
        self,
        user_id: int,
        language: str,
        level: LanguageLevel = LanguageLevel.A1
    ) -> bool:
        """Начать изучение языка"""
        if language not in self.supported_languages:
            return False

        course = LanguageCourse(
            language=language,
            level=level,
            lessons_completed=0,
            total_lessons=50,
            words_learned=0,
            last_practice=datetime.now(),
            streak_days=0
        )

        if user_id not in self._courses:
            self._courses[user_id] = {}

        self._courses[user_id][language] = course
        logger.info(f"📚 Пользователь {user_id} начал изучать {language}")
        return True

    async def practice_conversation(
        self,
        user_id: int,
        language: str,
        topic: str,
        user_message: str
    ) -> Tuple[str, str, Dict]:
        """
        Практика разговора

        Returns:
            (response, correction, feedback)
        """
        # Проверка доступа (админ бесплатно)
        is_admin = await self._check_admin_access(user_id)

        # AI диалог
        prompt = f"""
Ты — носитель языка {language}. Ведёшь диалог с учеником.

Тема: {topic}
Сообщение ученика: {user_message}

ЗАДАЧА:
1. Ответь естественно на языке {language}
2. Если есть ошибки — исправь их
3. Объясни грамматику если нужно
4. Поддержи разговор

ФОРМАТ ОТВЕТА (JSON):
{{
  "response": "Твой ответ на {language}",
  "corrections": [
    {{"original": "ошибка", "corrected": "правильно", "explanation": "правило"}}
  ],
  "vocabulary": [
    {{"word": "слово", "translation": "перевод", "example": "пример"}}
  ],
  "grammar_tip": "Совет по грамматике"
}}
"""

        response = await self.ai_client.complete(
            system=f"Ты — дружелюбный носитель {language}. Помогай ученику учиться.",
            user=prompt,
            mode="heavy"
        )

        # Парсим ответ
        result = self._parse_conversation_response(response)

        # Сохраняем сессию
        self._save_practice_session(
            user_id, language, "conversation",
            [{"question": user_message}], [result], 0, "", datetime.now()
        )

        return (
            result.get("response", ""),
            result.get("corrections", []),
            result.get("grammar_tip", "")
        )

    async def grammar_exercise(
        self,
        user_id: int,
        language: str,
        topic: str,
        level: LanguageLevel
    ) -> List[Dict]:
        """Генерация грамматических упражнений"""
        prompt = f"""
Создай 5 грамматических упражнений для языка {language}.

Тема: {topic}
Уровень: {level.value}

ФОРМАТ — JSON массив:
[
  {{
    "question": "Задание",
    "options": ["вариант 1", "вариант 2", "вариант 3"],
    "correct": 0,
    "explanation": "Объяснение правильного ответа"
  }}
]
"""

        response = await self.ai_client.complete(
            system="Создавай качественные упражнения. Только JSON.",
            user=prompt,
            mode="heavy"
        )

        exercises = self._parse_exercises(response)
        return exercises

    async def vocabulary_practice(
        self,
        user_id: int,
        language: str,
        topic: str,
        count: int = 10
    ) -> List[Dict]:
        """Практика словарного запаса"""
        prompt = f"""
Создай список из {count} слов для изучения.

Язык: {language}
Тема: {topic}

ФОРМАТ — JSON массив:
[
  {{
    "word": "слово на целевом языке",
    "translation": "перевод",
    "transcription": "/транскрипция/",
    "example_target": "Пример на целевом языке",
    "example_translation": "Перевод примера",
    "part_of_speech": "сущ./гл./прил."
  }}
]
"""

        response = await self.ai_client.complete(
            system="Подбирай полезные слова. Только JSON.",
            user=prompt,
            mode="fast"
        )

        vocabulary = self._parse_vocabulary(response)
        return vocabulary

    async def pronunciation_check(
        self,
        user_id: int,
        language: str,
        text: str,
        audio_url: Optional[str] = None
    ) -> Dict:
        """
        Проверка произношения

        Note: В реальном проекте — интеграция с STT API
        """
        prompt = f"""
Проверь произношение фразы на языке {language}.

Фраза: {text}

Дай обратную связь по:
1. Правильность произношения
2. Интонация
3. Ударение
4. Советы по улучшению

ФОРМАТ — JSON:
{{
  "score": 85,
  "feedback": "Общая обратная связь",
  "issues": [
    {{"sound": "звук", "issue": "проблема", "tip": "совет"}}
  ],
  "phonetic_transcription": "/фонетическая транскрипция/"
}}
"""

        response = await self.ai_client.complete(
            system="Давай конструктивную обратную связь по произношению.",
            user=prompt,
            mode="fast"
        )

        return self._parse_pronunciation(response)

    async def writing_correction(
        self,
        user_id: int,
        language: str,
        text: str
    ) -> Dict:
        """
        Исправление письменной работы

        Returns:
            Dict с исправлениями и оценкой
        """
        prompt = f"""
Исправь текст на языке {language}.

ТЕКСТ УЧЕНИКА:
{text}

ЗАДАЧА:
1. Исправь все ошибки
2. Объясни каждую ошибку
3. Дай оценку (A1-C2)
4. Предложи улучшенный вариант

ФОРМАТ — JSON:
{{
  "corrected_text": "Исправленный текст",
  "errors": [
    {{"original": "ошибка", "corrected": "правильно", "type": "грамматика/орфография", "explanation": "объяснение"}}
  ],
  "level": "B1",
  "score": 75,
  "improved_version": "Улучшенная версия",
  "feedback": "Общая обратная связь"
}}
"""

        response = await self.ai_client.complete(
            system="Исправляй ошибки и объясняй их. Только JSON.",
            user=prompt,
            mode="heavy"
        )

        return self._parse_writing(response)

    async def get_progress(
        self,
        user_id: int,
        language: str
    ) -> Optional[Dict]:
        """Получить прогресс ученика"""
        user_courses = self._courses.get(user_id, {})
        course = user_courses.get(language)

        if not course:
            return None

        return {
            "language": self.language_names.get(language, language),
            "level": course.level.value,
            "lessons_completed": course.lessons_completed,
            "total_lessons": course.total_lessons,
            "words_learned": course.words_learned,
            "streak_days": course.streak_days,
            "last_practice": course.last_practice.strftime("%Y-%m-%d")
        }

    async def daily_lesson(
        self,
        user_id: int,
        language: str
    ) -> Dict:
        """Ежедневный урок"""
        course = self._courses.get(user_id, {}).get(language)
        if not course:
            return {"error": "Курс не найден"}

        # Обновляем streak
        today = datetime.now().date()
        last_practice = course.last_practice.date()
        days_diff = (today - last_practice).days

        if days_diff == 1:
            course.streak_days += 1
        elif days_diff > 1:
            course.streak_days = 0

        course.last_practice = datetime.now()

        # Генерируем урок
        prompt = f"""
Создай ежедневный урок по языку {language}.

Уровень: {course.level.value}
День streak: {course.streak_days}

СТРУКТУРА:
1. Слово дня (с примером)
2. Грамматика дня (короткое правило)
3. Упражнение (5 вопросов)
4. Культурный факт

ФОРМАТ — JSON:
{{
  "word_of_day": {{"word": "", "translation": "", "example": ""}},
  "grammar_tip": "Правило",
  "exercises": [],
  "culture_fact": "Интересный факт"
}}
"""

        response = await self.ai_client.complete(
            system="Создавай интересные ежедневные уроки. Только JSON.",
            user=prompt,
            mode="fast"
        )

        lesson = self._parse_lesson(response)
        lesson["streak_days"] = course.streak_days
        return lesson

    async def _check_admin_access(self, user_id: int) -> bool:
        """Проверка админ доступа (бесплатно)"""
        admin_ids = config.ADMIN_IDS
        return user_id in admin_ids

    def _parse_conversation_response(self, response: str) -> Dict:
        """Парсинг ответа диалога"""
        import json
        try:
            return json.loads(response)
        except:
            return {"response": response, "corrections": [], "vocabulary": []}

    def _parse_exercises(self, response: str) -> List[Dict]:
        """Парсинг упражнений"""
        import json
        try:
            return json.loads(response)
        except:
            return []

    def _parse_vocabulary(self, response: str) -> List[Dict]:
        """Парсинг словаря"""
        import json
        try:
            return json.loads(response)
        except:
            return []

    def _parse_pronunciation(self, response: str) -> Dict:
        """Парсинг проверки произношения"""
        import json
        try:
            return json.loads(response)
        except:
            return {"score": 0, "feedback": ""}

    def _parse_writing(self, response: str) -> Dict:
        """Парсинг исправления письма"""
        import json
        try:
            return json.loads(response)
        except:
            return {}

    def _parse_lesson(self, response: str) -> Dict:
        """Парсинг урока"""
        import json
        try:
            return json.loads(response)
        except:
            return {}

    def _save_practice_session(
        self, user_id, language, exercise_type,
        questions, answers, score, feedback, timestamp
    ):
        """Сохранение сессии практики"""
        session = PracticeSession(
            user_id=user_id,
            language=language,
            exercise_type=exercise_type,
            questions=questions,
            answers=answers,
            score=score,
            feedback=feedback,
            timestamp=timestamp
        )
        self._practice_sessions.append(session)


# Глобальный экземпляр
ai_language_teacher: Optional[AILanguageTeacher] = None


def init_ai_language_teacher(ai_client):
    """Инициализация AI учителя языков"""
    global ai_language_teacher
    ai_language_teacher = AILanguageTeacher(ai_client)
    logger.info("✅ AI Учитель языков инициализирован")
    return ai_language_teacher
