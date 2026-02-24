"""
Модуль самообучения бота
Автоматическое сохранение полезных диалогов и добавление знаний в RAG базу
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from database import crud
from core.rag import RAGRetriever
from core.ai_client import OpenRouterClient
from config import config

logger = logging.getLogger(__name__)


class SelfLearner:
    """Класс для самообучения бота"""

    def __init__(self, ai_client: OpenRouterClient, rag: RAGRetriever):
        self.ai_client = ai_client
        self.rag = rag
        self._learning_queue: List[Dict] = []
        self._processed_dialogs: set = set()

    async def analyze_conversation(
        self,
        user_id: int,
        messages: List[Dict],
        force_learn: bool = False
    ) -> bool:
        """
        Анализ диалога и решение о добавлении в базу знаний

        Args:
            user_id: ID пользователя
            messages: Список сообщений диалога
            force_learn: Принудительное обучение

        Returns:
            bool: Был ли добавлен в базу знаний
        """
        if not config.AUTO_LEARN_ENABLED and not force_learn:
            return False

        if len(messages) < 2:
            return False

        # Извлекаем вопрос и ответ
        question = None
        answer = None

        for msg in messages[-4:]:  # Анализируем последние 4 сообщения
            if msg['role'] == 'user' and question is None:
                question = msg['content']
            elif msg['role'] == 'assistant' and answer is None:
                answer = msg['content']

        if not question or not answer:
            return False

        # Оцениваем полезность ответа
        usefulness_score = await self._evaluate_answer(question, answer)

        logger.info(
            f"Анализ диалога | Пользователь: {user_id} | "
            f"Полезность: {usefulness_score:.2f}"
        )

        # Добавляем если полезность выше порога или принудительно
        if usefulness_score >= config.AUTO_LEARN_THRESHOLD or force_learn:
            await self._add_to_knowledge_base(question, answer, usefulness_score)
            return True

        return False

    async def _evaluate_answer(self, question: str, answer: str) -> float:
        """
        Оценка качества ответа через AI

        Returns:
            float: Оценка от 0.0 до 1.0
        """
        eval_prompt = f"""
Оцени полезность ответа на вопрос по шкале от 0 до 1.

Вопрос: {question}

Ответ: {answer}

Критерии оценки:
- 0.9-1.0: Полный, точный, структурированный ответ с примерами
- 0.7-0.8: Хороший ответ, но можно дополнить
- 0.5-0.6: Ответ по теме, но поверхностный
- 0.3-0.4: Частично по теме, есть неточности
- 0.0-0.2: Не по теме или неверный ответ

Верни ТОЛЬКО число от 0.0 до 1.0 (например: 0.85)
"""

        try:
            response = await self.ai_client.complete(
                system="Ты — оценщик качества ответов. Будь объективен.",
                user=eval_prompt,
                mode="fast"
            )

            # Извлекаем число из ответа
            import re
            numbers = re.findall(r'0\.\d+|1\.0+|1', response)
            if numbers:
                score = float(numbers[0])
                return min(max(score, 0.0), 1.0)

            return 0.5  # По умолчанию средняя оценка

        except Exception as e:
            logger.error(f"Ошибка оценки ответа: {e}")
            return 0.5

    async def _add_to_knowledge_base(
        self,
        question: str,
        answer: str,
        score: float
    ) -> bool:
        """Добавление пары вопрос-ответ в базу знаний"""
        try:
            # Форматируем как учебный материал
            knowledge_text = f"""
# Вопрос: {question}

## Ответ:
{answer}

---
*Добавлено автоматически: {datetime.now().strftime('%Y-%m-%d %H:%M')}*
*Оценка полезности: {score:.2f}*
""".strip()

            # Добавляем в RAG базу
            self.rag.add_texts([knowledge_text])

            # Сохраняем в базу данных
            db = crud.get_session()
            crud.add_knowledge_record(
                db,
                category="Auto-learned",
                question=question,
                answer=answer,
                metadata={"score": score, "auto_learned": True}
            )
            db.close()

            logger.info(
                f"✅ Добавлено в базу знаний | Вопрос: {question[:50]}... | "
                f"Оценка: {score:.2f}"
            )

            return True

        except Exception as e:
            logger.error(f"Ошибка добавления в базу знаний: {e}")
            return False

    async def learn_from_feedback(
        self,
        user_id: int,
        question: str,
        answer: str,
        feedback: str
    ) -> bool:
        """
        Обучение на основе обратной связи от пользователя

        Args:
            user_id: ID пользователя
            question: Исходный вопрос
            answer: Данный ответ
            feedback: Обратная связь (например, "спасибо", "не то" и т.д.)

        Returns:
            bool: Успешность обучения
        """
        # Положительная обратная связь
        positive_keywords = [
            'спасибо', 'благодарю', 'отлично', 'супер', 'класс',
            'помог', 'полезно', 'круто', 'здорово', 'good', 'thanks'
        ]

        negative_keywords = [
            'не то', 'неправильно', 'ошибка', 'плохо', 'бесполезно',
            'не помогло', 'неверно', 'wrong', 'bad'
        ]

        feedback_lower = feedback.lower()

        is_positive = any(kw in feedback_lower for kw in positive_keywords)
        is_negative = any(kw in feedback_lower for kw in negative_keywords)

        if is_positive:
            # Добавляем в базу с высоким приоритетом
            logger.info(f"Положительный фидбек | Вопрос: {question[:50]}...")
            await self._add_to_knowledge_base(question, answer, 0.95)
            return True

        elif is_negative:
            # Помечаем для пересмотра
            logger.warning(f"Отрицательный фидбек | Вопрос: {question[:50]}...")
            await self._flag_for_review(question, answer, feedback)
            return True

        return False

    async def _flag_for_review(
        self,
        question: str,
        answer: str,
        reason: str
    ) -> None:
        """Пометка записи для ручной проверки администратором"""
        db = crud.get_session()
        try:
            crud.add_knowledge_record(
                db,
                category="Review-needed",
                question=question,
                answer=answer,
                metadata={"review_reason": reason, "needs_review": True}
            )
            logger.info(f"📋 Добавлено на проверку: {question[:50]}...")
        except Exception as e:
            logger.error(f"Ошибка при пометке на проверку: {e}")
        finally:
            db.close()

    async def batch_learn(
        self,
        conversations: List[Dict],
        progress_callback=None
    ) -> Dict:
        """
        Массовое обучение на основе истории диалогов

        Args:
            conversations: Список диалогов для обучения
            progress_callback: Функция для отслеживания прогресса

        Returns:
            Dict: Статистика обучения
        """
        total = len(conversations)
        learned = 0
        skipped = 0
        errors = 0

        for i, conv in enumerate(conversations):
            try:
                user_id = conv.get('user_id', 0)
                messages = conv.get('messages', [])

                if await self.analyze_conversation(user_id, messages):
                    learned += 1
                else:
                    skipped += 1

            except Exception as e:
                logger.error(f"Ошибка при обучении диалога {i}: {e}")
                errors += 1

            if progress_callback:
                await progress_callback(i + 1, total)

            # Небольшая задержка чтобы не перегружать API
            await asyncio.sleep(0.1)

        return {
            'total': total,
            'learned': learned,
            'skipped': skipped,
            'errors': errors
        }

    async def get_learning_stats(self) -> Dict:
        """Получить статистику самообучения"""
        db = crud.get_session()
        try:
            auto_learned = db.query(crud.Knowledge).filter(
                crud.Knowledge.metadata.contains('auto_learned')
            ).count()

            needs_review = db.query(crud.Knowledge).filter(
                crud.Knowledge.metadata.contains('needs_review')
            ).count()

            return {
                'auto_learned': auto_learned,
                'needs_review': needs_review,
                'enabled': config.AUTO_LEARN_ENABLED,
                'threshold': config.AUTO_LEARN_THRESHOLD
            }
        except Exception as e:
            logger.error(f"Ошибка получения статистики: {e}")
            return {'error': str(e)}
        finally:
            db.close()


# Глобальный экземпляр (инициализируется в bot.py)
self_learner: Optional[SelfLearner] = None


def init_self_learner(ai_client: OpenRouterClient, rag: RAGRetriever):
    """Инициализация самообучения"""
    global self_learner
    self_learner = SelfLearner(ai_client, rag)
    logger.info("✅ Система самообучения инициализирована")
    return self_learner
