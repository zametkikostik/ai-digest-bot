"""
Планировщик постов для Telegram-канала
"""
import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from aiogram import Bot
from core.ai_client import OpenRouterClient
from core.rag import RAGRetriever
from config import config

logger = logging.getLogger(__name__)


# Системный промпт для генерации постов
CREATE_POST_PROMPT = f"""
# РОЛЬ И ЛИЧНОСТЬ
Ты — универсальный AI-ассистент и контент-менеджер Telegram-канала.
Твоё имя: {config.BOT_NAME}. Тематика канала: {config.BOT_TOPIC}.
Язык общения: русский.

# ЗАДАЧА
Создавай полезный, структурированный контент для Telegram-канала.

# ФОРМАТ ПОСТА
1. Заголовок с эмодзи (привлекающий внимание)
2. Тело поста (структурировано, с абзацами)
3. Хэштеги (3-5 штук в конце)

# СТИЛЬ
- Экспертный, но живой
- Без воды и клише
- С конкретными примерами
- Длина: 800-1500 символов

# ВАЖНО
- Всегда добавляй призыв к действию в конце
- Используй Markdown форматирование
- Не упоминай что ты AI
- Используй информацию из RAG_CONTEXT если она передана
"""


class PostScheduler:
    """Планировщик автоматического постинга"""
    
    def __init__(
        self,
        bot: Bot,
        ai_client: OpenRouterClient,
        rag: RAGRetriever,
        channel_id: str
    ):
        self.bot = bot
        self.ai_client = ai_client
        self.rag = rag
        self.channel_id = channel_id
        self.scheduler = AsyncIOScheduler(timezone='Europe/Moscow')
        logger.info("Планировщик постов инициализирован")
    
    async def generate_and_post(self, topic: str) -> bool:
        """
        Сгенерировать пост и опубликовать в канале
        
        Args:
            topic: Тема поста
            
        Returns:
            True если успешно
        """
        try:
            logger.info(f"Генерация поста на тему: {topic}")
            
            # RAG-поиск по теме
            rag_context = self.rag.retrieve(topic)
            
            # Формирование запроса
            user_message = f"[ACTION: CREATE_POST]\nТема: {topic}"
            if rag_context:
                user_message += f"\n\n[RAG_CONTEXT]\n{rag_context}"
            
            # Генерация поста через AI
            post_content = await self.ai_client.complete(
                system=CREATE_POST_PROMPT,
                user=user_message,
                mode="heavy",
                max_tokens=2048,
                temperature=0.7
            )
            
            logger.info(f"Пост сгенерирован ({len(post_content)} символов)")
            
            # Публикация в канале
            await self.bot.send_message(
                chat_id=self.channel_id,
                text=post_content,
                parse_mode='Markdown'
            )
            
            logger.info(f"Пост опубликован в канале {self.channel_id}")
            return True
            
        except Exception as e:
            logger.error(f"Ошибка при публикации поста: {e}")
            return False
    
    async def generate_post_preview(self, topic: str) -> str:
        """
        Сгенерировать предпросмотр поста (без публикации)
        
        Args:
            topic: Тема поста
            
        Returns:
            Текст поста
        """
        rag_context = self.rag.retrieve(topic)
        
        user_message = f"[ACTION: CREATE_POST]\nТема: {topic}"
        if rag_context:
            user_message += f"\n\n[RAG_CONTEXT]\n{rag_context}"
        
        return await self.ai_client.complete(
            system=CREATE_POST_PROMPT,
            user=user_message,
            mode="heavy"
        )
    
    def setup_schedule(self):
        """Настроить расписание постинга из конфига"""
        for job_config in config.POST_SCHEDULE:
            self.scheduler.add_job(
                self.generate_and_post,
                CronTrigger(
                    hour=job_config['hour'],
                    minute=job_config['minute'],
                    timezone='Europe/Moscow'
                ),
                args=[job_config['topic']],
                id=f"post_{job_config['topic']}",
                replace_existing=True
            )
            logger.info(
                f"Запланирован пост '{job_config['topic']}' "
                f"на {job_config['hour']:02d}:{job_config['minute']:02d}"
            )
    
    def start(self):
        """Запустить планировщик"""
        self.setup_schedule()
        self.scheduler.start()
        logger.info("Планировщик запущен")
    
    def stop(self):
        """Остановить планировщик"""
        self.scheduler.shutdown()
        logger.info("Планировщик остановлен")
    
    def get_schedule(self) -> list[dict]:
        """Получить текущее расписание"""
        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None
            })
        return jobs


# Промпт для генерации контент-плана
CONTENT_PLAN_PROMPT = f"""
Создай контент-план на 7 дней для Telegram-канала на тему {config.BOT_TOPIC}.

Формат ответа — JSON массив:
[
  {{
    "day": 1,
    "topic": "Тема поста",
    "format": "how-to|list|case-study|opinion|news",
    "hook": "Первая фраза-крючок",
    "hashtags": ["#тег1", "#тег2"]
  }}
]

Требования:
- Разнообразь форматы (how-to, list, case-study, opinion, news)
- Темы должны быть полезными и интересными для аудитории
- Учти информацию из RAG_CONTEXT если передан
- Верни ТОЛЬКО валидный JSON, без пояснений
"""
