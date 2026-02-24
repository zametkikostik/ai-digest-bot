"""
AI Журналист и AI Эксперт
Создание аналитических статей, новостей, постов для каналов
Автопостинг по расписанию
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import aiohttp

logger = logging.getLogger(__name__)


class ArticleType(Enum):
    """Типы статей"""
    NEWS = "news"
    ANALYTICS = "analytics"
    REVIEW = "review"
    OPINION = "opinion"
    HOWTO = "howto"
    INTERVIEW = "interview"


class ChannelType(Enum):
    """Типы каналов"""
    TELEGRAM = "telegram"
    VK = "vk"
    YANDEX_ZEN = "zen"
    TWITTER = "twitter"
    FACEBOOK = "facebook"


@dataclass
class Article:
    """Статья"""
    id: str
    title: str
    content: str
    article_type: ArticleType
    channel_type: ChannelType
    tags: List[str]
    author: str
    created_at: datetime
    scheduled_for: Optional[datetime]
    status: str  # draft, scheduled, published
    views: int = 0
    likes: int = 0
    shares: int = 0


@dataclass
class NewsSource:
    """Источник новостей"""
    name: str
    url: str
    category: str
    language: str
    reliability: int  # 1-10


class AIJournalist:
    """AI Журналист для создания статей и новостей"""

    def __init__(self, ai_client):
        self.ai_client = ai_client
        self._articles: List[Article] = []
        self._news_sources: List[NewsSource] = []
        self._scheduled_posts: List[Article] = []
        
        # Источники новостей
        self._initialize_news_sources()

    def _initialize_news_sources(self):
        """Инициализация источников новостей"""
        self._news_sources = [
            # Россия
            NewsSource("РИА Новости", "https://ria.ru/", "general", "ru", 9),
            NewsSource("ТАСС", "https://tass.ru/", "general", "ru", 9),
            NewsSource("Интерфакс", "https://interfax.ru/", "general", "ru", 8),
            NewsSource("Коммерсантъ", "https://kommersant.ru/", "business", "ru", 8),
            NewsSource("Ведомости", "https://vedomosti.ru/", "business", "ru", 8),
            NewsSource("РБК", "https://rbk.ru/", "business", "ru", 8),
            
            # Технологии
            NewsSource("VC.ru", "https://vc.ru/", "tech", "ru", 7),
            NewsSource("Habr", "https://habr.com/", "tech", "ru", 8),
            NewsSource("3DNews", "https://3dnews.ru/", "tech", "ru", 7),
            
            # Криптовалюты
            NewsSource("CoinDesk", "https://coindesk.com/", "crypto", "en", 8),
            NewsSource("Cointelegraph", "https://cointelegraph.com/", "crypto", "en", 7),
            
            # Болгария
            NewsSource("Dnevnik", "https://dnevnik.bg/", "general", "bg", 8),
            NewsSource("Capital", "https://capital.bg/", "business", "bg", 8),
        ]

    async def create_article(
        self,
        topic: str,
        article_type: ArticleType,
        channel_type: ChannelType,
        target_audience: str = "general",
        word_count: int = 1000
    ) -> Article:
        """
        Создание статьи

        Args:
            topic: Тема статьи
            article_type: Тип статьи
            channel_type: Тип канала
            target_audience: Целевая аудитория
            word_count: Количество слов

        Returns:
            Article: Готовая статья
        """
        prompt = self._create_article_prompt(
            topic, article_type, target_audience, word_count
        )

        response = await self.ai_client.complete(
            system=self._get_system_prompt(article_type, channel_type),
            user=prompt,
            mode="heavy"
        )

        # Парсим ответ
        article = self._parse_article_response(
            response, topic, article_type, channel_type
        )

        self._articles.append(article)
        logger.info(f"📝 Статья создана: {topic}")

        return article

    async def create_analytics_article(
        self,
        topic: str,
        data_points: List[Dict],
        channel_type: ChannelType
    ) -> Article:
        """
        Создание аналитической статьи с данными

        Args:
            topic: Тема
            data_points: Точки данных для анализа
            channel_type: Тип канала

        Returns:
            Article: Аналитическая статья
        """
        # Собираем данные
        data_summary = "\n".join([
            f"• {d.get('label', '')}: {d.get('value', '')}"
            for d in data_points
        ])

        prompt = f"""
Создай аналитическую статью на тему: {topic}

ДАННЫЕ ДЛЯ АНАЛИЗА:
{data_summary}

ТРЕБОВАНИЯ:
1. Проанализируй данные
2. Выяви тренды и закономерности
3. Сравни с предыдущими периодами
4. Дай прогнозы
5. Добавь экспертное мнение

СТРУКТУРА:
📊 Введение (кратко о теме)
📈 Анализ данных (с цифрами)
🔍 Выявленные тренды
🔮 Прогнозы
💡 Выводы и рекомендации

Длина: 1500-2000 слов
Стиль: Профессиональный, но доступный
"""

        response = await self.ai_client.complete(
            system="Ты — опытный аналитик и журналист. Пиши глубокие аналитические статьи с данными.",
            user=prompt,
            mode="heavy"
        )

        article = Article(
            id=f"analytics_{datetime.now().timestamp()}",
            title=topic,
            content=response,
            article_type=ArticleType.ANALYTICS,
            channel_type=channel_type,
            tags=["аналитика", "данные", "тренды"],
            author="AI Журналист",
            created_at=datetime.now(),
            scheduled_for=None,
            status="draft"
        )

        self._articles.append(article)
        return article

    async def fetch_news(self, category: str = "general", limit: int = 10) -> List[Dict]:
        """
        Получение новостей из источников

        Args:
            category: Категория
            limit: Количество новостей

        Returns:
            Список новостей
        """
        news_items = []

        # Фильтруем источники по категории
        sources = [s for s in self._news_sources if s.category == category or category == "general"]

        for source in sources[:5]:  # Берём топ-5 источников
            try:
                # В реальном проекте — парсинг RSS/API
                # Для примера — генерация через AI
                news = await self._generate_news_summary(source, limit // 5)
                news_items.extend(news)
            except Exception as e:
                logger.error(f"Ошибка получения новостей из {source.name}: {e}")

        return news_items

    async def create_news_digest(
        self,
        category: str = "general",
        channel_type: ChannelType = ChannelType.TELEGRAM
    ) -> str:
        """
        Создание дайджеста новостей

        Returns:
            str: Текст дайджеста
        """
        news_items = await self.fetch_news(category)

        if not news_items:
            return "❌ Новости временно недоступны"

        # Формируем дайджест
        digest = f"📰 **Дайджест новостей** ({category})\n\n"
        digest += f"🕒 {datetime.now().strftime('%d.%m.%Y %H:%M')}\n\n"

        for i, news in enumerate(news_items[:10], 1):
            digest += f"{i}. **{news.get('title', 'Без названия')}**\n"
            digest += f"   {news.get('summary', '')[:200]}...\n\n"

        digest += "\n#новости #дайджест"

        return digest

    async def schedule_post(
        self,
        article: Article,
        scheduled_time: datetime,
        channel_id: str
    ) -> bool:
        """Планирование поста"""
        article.scheduled_for = scheduled_time
        article.status = "scheduled"
        
        self._scheduled_posts.append(article)
        
        logger.info(f"📅 Пост запланирован на {scheduled_time}")
        return True

    async def auto_post_to_channel(
        self,
        bot,
        channel_id: str,
        article: Article
    ) -> bool:
        """
        Автопостинг в канал

        Args:
            bot: Экземпляр бота
            channel_id: ID канала
            article: Статья для публикации

        Returns:
            bool: Успешность
        """
        try:
            # Форматируем пост для Telegram
            formatted_content = self._format_for_telegram(article)

            # Отправляем
            await bot.send_message(
                chat_id=channel_id,
                text=formatted_content,
                parse_mode='Markdown'
            )

            article.status = "published"
            logger.info(f"✅ Пост опубликован в канале {channel_id}")

            return True

        except Exception as e:
            logger.error(f"Ошибка публикации: {e}")
            return False

    def _create_article_prompt(
        self,
        topic: str,
        article_type: ArticleType,
        target_audience: str,
        word_count: int
    ) -> str:
        """Создание промпта для статьи"""
        type_instructions = {
            ArticleType.NEWS: "Пиши в стиле новостной заметки. Кратко, по делу, факты.",
            ArticleType.ANALYTICS: "Глубокий анализ с данными, графиками, выводами.",
            ArticleType.REVIEW: "Объективный обзор с плюсами, минусами, рекомендациями.",
            ArticleType.OPINION: "Авторская колонка с личным мнением и аргументацией.",
            ArticleType.HOWTO: "Пошаговая инструкция с примерами.",
            ArticleType.INTERVIEW: "Формат вопрос-ответ с экспертом."
        }

        return f"""
Тема статьи: {topic}
Тип: {article_type.value}
Целевая аудитория: {target_audience}
Примерное количество слов: {word_count}

{type_instructions.get(article_type, "")}

СТРУКТУРА:
1. Цепляющий заголовок
2. Введение (лид)
3. Основная часть
4. Выводы
5. Призыв к действию (если уместно)

Напиши качественную, информативную статью.
"""

    def _get_system_prompt(
        self,
        article_type: ArticleType,
        channel_type: ChannelType
    ) -> str:
        """Системный промпт для журналиста"""
        channel_instructions = {
            ChannelType.TELEGRAM: "Пиши для Telegram. Используй эмодзи, разбивай на абзацы, добавляй хэштеги.",
            ChannelType.VK: "Пиши для ВКонтакте. Более развёрнуто, можно лонгриды.",
            ChannelType.YANDEX_ZEN: "Пиши для Дзена. SEO-оптимизировано, цепляющие заголовки.",
            ChannelType.TWITTER: "Пиши для Twitter. Кратко, треды.",
            ChannelType.FACEBOOK: "Пиши для Facebook. Развёрнуто, с вовлечением."
        }

        return f"""
Ты — профессиональный журналист и редактор.
{channel_instructions.get(channel_type, "")}

Создавай качественный контент с высокой ценностью для читателей.
Избегай кликбейта, пиши по существу.
"""

    def _parse_article_response(
        self,
        response: str,
        topic: str,
        article_type: ArticleType,
        channel_type: ChannelType
    ) -> Article:
        """Парсинг ответа AI в статью"""
        # Извлекаем заголовок (первая строка)
        lines = response.split('\n')
        title = lines[0].strip('#').strip() if lines else topic

        # Извлекаем теги
        tags = self._extract_tags(response)

        return Article(
            id=f"article_{datetime.now().timestamp()}",
            title=title,
            content=response,
            article_type=article_type,
            channel_type=channel_type,
            tags=tags,
            author="AI Журналист",
            created_at=datetime.now(),
            scheduled_for=None,
            status="draft"
        )

    def _extract_tags(self, content: str) -> List[str]:
        """Извлечение тегов из контента"""
        import re
        tags = re.findall(r'#(\w+)', content)
        return tags[:10]  # Макс 10 тегов

    def _format_for_telegram(self, article: Article) -> str:
        """Форматирование для Telegram"""
        content = article.content

        # Добавляем заголовок
        formatted = f"**{article.title}**\n\n"

        # Добавляем контент
        formatted += content

        # Добавляем футер
        formatted += f"\n\n# {' #'.join(article.tags)}"
        formatted += f"\n\n📰 AI Журналист • {datetime.now().strftime('%d.%m.%Y')}"

        return formatted

    async def _generate_news_summary(
        self,
        source: NewsSource,
        count: int
    ) -> List[Dict]:
        """Генерация сводки новостей (вместо парсинга)"""
        prompt = f"""
Сгенерируй {count} реалистичных заголовков новостей из источника: {source.name}
Категория: {source.category}
Язык: {source.language}

Формат — JSON массив:
[
  {{
    "title": "Заголовок",
    "summary": "Краткое содержание (2-3 предложения)",
    "url": "https://example.com/news/1",
    "published_at": "2024-01-01T10:00:00Z"
  }}
]
"""

        response = await self.ai_client.complete(
            system="Генерируй реалистичные новости. Только JSON.",
            user=prompt,
            mode="fast"
        )

        # Парсим JSON
        import json
        try:
            return json.loads(response)
        except:
            return []


class AIExpert:
    """AI Эксперт для ведения каналов"""

    def __init__(self, ai_client, journalist: AIJournalist):
        self.ai_client = ai_client
        self.journalist = journalist
        self._expertise_areas = [
            "investments",
            "crypto",
            "business",
            "ai_technology",
            "education",
            "law",
            "seo_marketing"
        ]

    async def create_expert_post(
        self,
        area: str,
        topic: str,
        channel_type: ChannelType = ChannelType.TELEGRAM
    ) -> str:
        """
        Создание экспертного поста

        Args:
            area: Область экспертизы
            topic: Тема
            channel_type: Тип канала

        Returns:
            str: Текст поста
        """
        prompt = f"""
Ты — признанный эксперт в области: {area}

Создай экспертный пост на тему: {topic}

ТРЕБОВАНИЯ:
1. Глубокая экспертиза (не поверхностно)
2. Конкретные примеры и кейсы
3. Цифры и данные
4. Практические рекомендации
5. Прогнозы и тренды

СТРУКТУРА:
🎯 Проблема/Возможность
📊 Анализ ситуации
💡 Решение/Стратегия
📈 Примеры из практики
🔮 Прогноз
✅ Action steps

Длина: 1000-1500 символов (для Telegram)
Стиль: Экспертный, но доступный
"""

        response = await self.ai_client.complete(
            system=f"Ты — эксперт в {area}. Делись глубокими знаниями с аудиторией.",
            user=prompt,
            mode="heavy"
        )

        return response

    async def create_content_plan(
        self,
        area: str,
        days: int = 7,
        posts_per_day: int = 3
    ) -> List[Dict]:
        """
        Создание контент-плана

        Returns:
            Список постов по дням
        """
        prompt = f"""
Создай контент-план на {days} дней для канала об {area}.
Постов в день: {posts_per_day}

Формат — JSON массив:
[
  {{
    "day": 1,
    "time": "09:00",
    "topic": "Тема поста",
    "type": "educational|news|opinion|case-study",
    "hook": "Цепляющая первая фраза",
    "hashtags": ["#тег1", "#тег2"]
  }}
]

Требования:
- Разнообразь типы контента
- Учитывай лучшее время для постинга
- Темы должны быть актуальными
- Добавляй вовлекающие элементы
"""

        response = await self.ai_client.complete(
            system="Создавай качественные контент-планы. Только JSON.",
            user=prompt,
            mode="heavy"
        )

        # Парсим JSON
        import json
        try:
            return json.loads(response)
        except:
            return []


# Глобальные экземпляры
ai_journalist: Optional[AIJournalist] = None
ai_expert: Optional[AIExpert] = None


def init_ai_journalist_and_expert(ai_client):
    """Инициализация журналиста и эксперта"""
    global ai_journalist, ai_expert
    
    ai_journalist = AIJournalist(ai_client)
    ai_expert = AIExpert(ai_client, ai_journalist)
    
    logger.info("✅ AI Журналист и AI Эксперт инициализированы")
    return ai_journalist, ai_expert
