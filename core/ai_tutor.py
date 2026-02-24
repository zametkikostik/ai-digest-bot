"""
AI Репетитор — Подготовка к ОГЭ и ЕГЭ
Реальные предметы, объяснение сложного простым языком
Автообновление знаний, отслеживание изменений в экзаменах
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import aiohttp
from config import config

logger = logging.getLogger(__name__)


class Subject(Enum):
    """Предметы для подготовки"""
    MATH = "math"
    RUSSIAN = "russian"
    PHYSICS = "physics"
    SOCIAL_STUDIES = "social_studies"  # Обществознание
    HISTORY = "history"
    LITERATURE = "literature"
    GEOGRAPHY = "geography"
    BIOLOGY = "biology"
    CHEMISTRY = "chemistry"
    ENGLISH = "english"
    INFORMATICS = "informatics"
    FOREIGN_LANG = "foreign_lang"


class ExamType(Enum):
    """Тип экзамена"""
    OGE = "oge"  # 9 класс
    EGE = "ege"  # 11 класс


@dataclass
class ExamQuestion:
    """Вопрос для подготовки"""
    id: str
    subject: Subject
    exam_type: ExamType
    question_text: str
    correct_answer: str
    explanation: str
    difficulty: int  # 1-5
    topic: str
    year: int


@dataclass
class StudentProgress:
    """Прогресс студента"""
    user_id: int
    subject: Subject
    exam_type: ExamType
    questions_answered: int
    correct_answers: int
    weak_topics: List[str]
    strong_topics: List[str]
    last_study_date: datetime
    target_score: int
    current_level: str  # "beginner", "intermediate", "advanced"


class AITutor:
    """AI Репетитор для подготовки к ОГЭ/ЕГЭ"""

    def __init__(self, ai_client):
        self.ai_client = ai_client
        self._subject_knowledge: Dict[Subject, Dict] = {}
        self._exam_updates: Dict[str, datetime] = {}
        self._student_progress: Dict[int, StudentProgress] = {}
        
        # Демо доступ (7 дней)
        self._demo_period_days = 7
        self._user_demo_start: Dict[int, datetime] = {}
        
        # Предметы и темы
        self._initialize_subjects()

    def _initialize_subjects(self):
        """Инициализация предметов и тем"""
        self._subject_knowledge = {
            Subject.MATH: {
                "name": "Математика",
                "oge_topics": [
                    "Алгебраические выражения",
                    "Уравнения и неравенства",
                    "Функции и графики",
                    "Планиметрия",
                    "Стереометрия",
                    "Теория вероятностей",
                    "Текстовые задачи"
                ],
                "ege_topics": [
                    "Тригонометрия",
                    "Производная и интеграл",
                    "Параметры",
                    "Стереометрия (сложная)",
                    "Экономика",
                    "Олимпиадная математика"
                ],
                "formulas": [],
                "last_update": None
            },
            Subject.RUSSIAN: {
                "name": "Русский язык",
                "oge_topics": [
                    "Орфография",
                    "Пунктуация",
                    "Грамматика",
                    "Сочинение",
                    "Изложение"
                ],
                "ege_topics": [
                    "Орфография (сложная)",
                    "Пунктуация (сложная)",
                    "Культура речи",
                    "Сочинение (егэ)",
                    "Задания с текстом"
                ],
                "rules": [],
                "last_update": None
            },
            Subject.PHYSICS: {
                "name": "Физика",
                "oge_topics": [
                    "Механика",
                    "Термодинамика",
                    "Электричество",
                    "Оптика",
                    "Квантовая физика"
                ],
                "ege_topics": [
                    "Механика (сложная)",
                    "Молекулярная физика",
                    "Электродинамика",
                    "Квантовая физика",
                    "Астрофизика"
                ],
                "formulas": [],
                "last_update": None
            },
            Subject.SOCIAL_STUDIES: {
                "name": "Обществознание",
                "oge_topics": [
                    "Человек и общество",
                    "Экономика",
                    "Социология",
                    "Политология",
                    "Правоведение"
                ],
                "ege_topics": [
                    "Экономика (углубленно)",
                    "Политология (углубленно)",
                    "Право (углубленно)",
                    "Философия",
                    "Задания с развернутым ответом"
                ],
                "last_update": None
            },
            Subject.HISTORY: {
                "name": "История России",
                "oge_topics": [
                    "Древняя Русь",
                    "Московское царство",
                    "Российская Империя",
                    "СССР",
                    "Современная Россия"
                ],
                "ege_topics": [
                    "История России (полный курс)",
                    "Всеобщая история",
                    "Исторические личности",
                    "Культура и наука",
                    "Работа с картой"
                ],
                "last_update": None
            },
            Subject.BIOLOGY: {
                "name": "Биология",
                "oge_topics": [
                    "Ботаника",
                    "Зоология",
                    "Анатомия",
                    "Общая биология"
                ],
                "ege_topics": [
                    "Цитология",
                    "Генетика",
                    "Эволюция",
                    "Экология",
                    "Биохимия"
                ],
                "last_update": None
            },
            Subject.CHEMISTRY: {
                "name": "Химия",
                "oge_topics": [
                    "Неорганическая химия",
                    "Органическая химия",
                    "Химические реакции",
                    "Решение задач"
                ],
                "ege_topics": [
                    "Неорганическая химия (углубленно)",
                    "Органическая химия (углубленно)",
                    "Химическая кинетика",
                    "Электролиз",
                    "Качественные реакции"
                ],
                "last_update": None
            },
            Subject.INFORMATICS: {
                "name": "Информатика",
                "oge_topics": [
                    "Алгоритмы",
                    "Программирование",
                    "Базы данных",
                    "Компьютерные сети"
                ],
                "ege_topics": [
                    "Программирование (Python/C++)",
                    "Теория игр",
                    "Динамическое программирование",
                    "Обработка данных",
                    "Системы счисления"
                ],
                "last_update": None
            },
            Subject.ENGLISH: {
                "name": "Английский язык",
                "oge_topics": [
                    "Грамматика",
                    "Лексика",
                    "Чтение",
                    "Аудирование",
                    "Говорение"
                ],
                "ege_topics": [
                    "Продвинутая грамматика",
                    "Эссе",
                    "Устный экзамен",
                    "Перевод",
                    "Страноведение"
                ],
                "last_update": None
            }
        }

    async def check_access(self, user_id: int) -> Tuple[bool, str]:
        """
        Проверка доступа к репетитору

        Returns:
            (has_access, message)
        """
        db = self._get_db()
        user = await self._get_user_subscription(db, user_id)
        
        if user and user.is_premium:
            return True, "Premium доступ"
        
        # Проверка демо
        if user_id in self._user_demo_start:
            demo_end = self._user_demo_start[user_id] + timedelta(days=self._demo_period_days)
            if datetime.now() < demo_end:
                days_left = (demo_end - datetime.now()).days
                return True, f"Демо доступ (осталось дней: {days_left})"
        
        # Активация демо
        if user_id not in self._user_demo_start:
            self._user_demo_start[user_id] = datetime.now()
            return True, f"Демо доступ активирован ({self._demo_period_days} дней)"
        
        return False, "Демо истекло. Оформите подписку за 299₽/мес"

    async def explain_topic(
        self,
        subject: Subject,
        topic: str,
        exam_type: ExamType,
        user_level: str = "beginner"
    ) -> str:
        """
        Объяснение темы простым языком

        Args:
            subject: Предмет
            topic: Тема
            exam_type: Тип экзамена
            user_level: Уровень ученика

        Returns:
            str: Объяснение темы
        """
        # Получаем информацию о теме
        subject_data = self._subject_knowledge.get(subject, {})
        topics = subject_data.get(f"{exam_type.value}_topics", [])
        
        if topic not in topics:
            return f"Тема '{topic}' не найдена в предмете {subject_data.get('name', '')}"

        # Формируем промпт для объяснения
        prompt = f"""
Ты — опытный репетитор по {subject_data.get('name', '')}.
Твоя задача — объяснить тему "{topic}" для подготовки к {exam_type.value.upper()}.

Уровень ученика: {user_level}

ТРЕБОВАНИЯ К ОБЪЯСНЕНИЮ:
1. Объясняй сложное простым языком, с аналогиями из жизни
2. Используй примеры и пошаговые решения
3. Выдели ключевые формулы/правила
4. Добавь типичные ошибки и как их избежать
5. Дай 2-3 примера заданий с решением
6. В конце — краткое резюме (5 главных пунктов)

СТРУКТУРА ОТВЕТА:
📚 Теория (простым языком)
💡 Примеры и аналогии
📝 Формулы/правила
⚠️ Типичные ошибки
✏️ Практика (задания с решением)
📌 Главное за 1 минуту

Важно: Адаптируй сложность под уровень {user_level}
"""

        response = await self.ai_client.complete(
            system="Ты — профессиональный репетитор ОГЭ/ЕГЭ. Объясняй сложное простым языком.",
            user=prompt,
            mode="heavy"
        )

        return response

    async def generate_practice(
        self,
        subject: Subject,
        topic: str,
        exam_type: ExamType,
        count: int = 5
    ) -> List[ExamQuestion]:
        """
        Генерация практики по теме

        Returns:
            Список вопросов для практики
        """
        subject_data = self._subject_knowledge.get(subject, {})
        
        prompt = f"""
Сгенерируй {count} заданий для подготовки к {exam_type.value.upper()} по предмету {subject_data.get('name', '')}.

Тема: {topic}

Формат ответа — JSON массив:
[
  {{
    "id": "unique_id",
    "question_text": "Текст задания",
    "correct_answer": "Правильный ответ",
    "explanation": "Подробное объяснение решения",
    "difficulty": 3,
    "topic": "{topic}"
  }}
]

Требования:
- Задания должны соответствовать формату {exam_type.value.upper()}
- Разная сложность (1-5)
- Подробные объяснения решений
- Актуальные требования ФИПИ
"""

        response = await self.ai_client.complete(
            system="Генерируй задания в формате ОГЭ/ЕГЭ. Возвращай только валидный JSON.",
            user=prompt,
            mode="heavy"
        )

        # Парсим JSON ответ
        questions = self._parse_questions_json(response, subject, exam_type)
        return questions

    async def check_answer(
        self,
        question: ExamQuestion,
        user_answer: str
    ) -> Tuple[bool, str]:
        """
        Проверка ответа ученика

        Returns:
            (is_correct, feedback)
        """
        is_correct = question.correct_answer.strip().lower() == user_answer.strip().lower()
        
        if is_correct:
            feedback = "✅ Правильно! Молодец!"
        else:
            feedback = f"❌ Неверно. Правильный ответ: {question.correct_answer}\n\n📖 Объяснение:\n{question.explanation}"
        
        return is_correct, feedback

    async def get_weak_topics(self, user_id: int, subject: Subject) -> List[str]:
        """Получить слабые темы ученика"""
        progress = self._student_progress.get(user_id)
        if not progress or progress.subject != subject:
            return []
        
        return progress.weak_topics

    async def create_study_plan(
        self,
        user_id: int,
        subject: Subject,
        exam_type: ExamType,
        days_until_exam: int,
        hours_per_day: float = 1.0
    ) -> str:
        """
        Создание персонального плана подготовки

        Args:
            user_id: ID ученика
            subject: Предмет
            exam_type: Тип экзамена
            days_until_exam: Дней до экзамена
            hours_per_day: Часов в день

        Returns:
            str: План подготовки
        """
        subject_data = self._subject_knowledge.get(subject, {})
        topics = subject_data.get(f"{exam_type.value}_topics", [])
        
        # Получаем слабые темы
        weak_topics = await self.get_weak_topics(user_id, subject)
        
        prompt = f"""
Создай персональный план подготовки к {exam_type.value.upper()} по предмету {subject_data.get('name', '')}.

Параметры:
- Дней до экзамена: {days_until_exam}
- Часов в день: {hours_per_day}
- Слабые темы: {', '.join(weak_topics) if weak_topics else 'нет данных'}
- Все темы: {', '.join(topics)}

ТРЕБОВАНИЯ К ПЛАНУ:
1. Распредели все темы по дням
2. Больше времени удели слабым темам
3. Включи повторение (каждую неделю)
4. Добавь пробные экзамены (раз в 2 недели)
5. Оставь 3-5 дней перед экзаменом на лёгкое повторение

ФОРМАТ:
📅 План подготовки к {exam_type.value.upper()} ({subject_data.get('name', '')})

Неделя 1:
- День 1: [Тема] (X часов)
- День 2: [Тема] (X часов)
...

Рекомендации:
- ...
"""

        response = await self.ai_client.complete(
            system="Создавай реалистичные планы подготовки с учётом времени.",
            user=prompt,
            mode="heavy"
        )

        return response

    async def update_exam_requirements(self):
        """
        Автообновление требований к экзаменам
        Мониторинг сайта ФИПИ и других источников
        """
        logger.info("🔄 Обновление требований к экзаменам...")
        
        try:
            async with aiohttp.ClientSession() as session:
                # ФИПИ (демоверсии, спецификации)
                fipi_url = "http://fipi.ru/ege-i-gve-11-klass/demoversii"
                
                async with session.get(fipi_url, timeout=10) as response:
                    if response.status == 200:
                        # Парсим изменения (упрощённо)
                        content = await response.text()
                        
                        # Проверяем на наличие новых демоверсий
                        if "2025" in content or "2026" in content:
                            logger.info("✅ Найдены обновления ФИПИ")
                            await self._process_fipi_updates(content)
                    
                # Обновляем timestamp
                self._exam_updates["last_check"] = datetime.now()
                
        except Exception as e:
            logger.error(f"Ошибка обновления экзаменов: {e}")

    async def _process_fipi_updates(self, content: str):
        """Обработка обновлений ФИПИ"""
        # Здесь будет логика парсинга изменений
        # Для примера — просто логирование
        logger.info("📊 Анализ изменений в требованиях...")

    def _parse_questions_json(
        self,
        json_str: str,
        subject: Subject,
        exam_type: ExamType
    ) -> List[ExamQuestion]:
        """Парсинг JSON с вопросами"""
        import json
        try:
            data = json.loads(json_str)
            questions = []
            
            for item in data:
                q = ExamQuestion(
                    id=item.get('id', ''),
                    subject=subject,
                    exam_type=exam_type,
                    question_text=item.get('question_text', ''),
                    correct_answer=str(item.get('correct_answer', '')),
                    explanation=item.get('explanation', ''),
                    difficulty=item.get('difficulty', 3),
                    topic=item.get('topic', ''),
                    year=datetime.now().year
                )
                questions.append(q)
            
            return questions
        except Exception as e:
            logger.error(f"Ошибка парсинга вопросов: {e}")
            return []

    def _get_db(self):
        """Получение сессии БД"""
        from database import crud
        return crud.get_session()

    async def _get_user_subscription(self, db, user_id: int):
        """Получение информации о подписке"""
        from database import crud
        return crud.get_user(db, user_id)


# Глобальный экземпляр
ai_tutor: Optional[AITutor] = None


def init_ai_tutor(ai_client):
    """Инициализация AI репетитора"""
    global ai_tutor
    ai_tutor = AITutor(ai_client)
    logger.info("✅ AI Репетитор инициализирован")
    return ai_tutor
