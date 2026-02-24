"""
AI SEO Эксперт — Продвижение сайтов
GEO AI, SEO оптимизация, мониторинг позиций в реальном времени
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import aiohttp
import re

logger = logging.getLogger(__name__)


@dataclass
class SEOAudit:
    """Результаты SEO аудита"""
    url: str
    score: int  # 0-100
    issues: List[Dict]
    recommendations: List[str]
    timestamp: datetime


@dataclass
class KeywordRanking:
    """Позиции ключевых слов"""
    keyword: str
    position: int
    url: str
    search_volume: int
    difficulty: int
    cpc: float


@dataclass
class CompetitorAnalysis:
    """Анализ конкурентов"""
    domain: str
    authority: int
    backlinks: int
    keywords: int
    traffic: int


class AISEOExpert:
    """AI SEO эксперт для продвижения сайтов"""

    def __init__(self, ai_client):
        self.ai_client = ai_client
        self._tracked_keywords: Dict[str, List[KeywordRanking]] = {}
        self._competitors: Dict[str, List[CompetitorAnalysis]] = {}
        self._audit_history: List[SEOAudit] = []

    async def seo_audit(self, url: str) -> SEOAudit:
        """
        Полный SEO аудит сайта

        Args:
            url: URL сайта для аудита

        Returns:
            SEOAudit: Результаты аудита
        """
        issues = []
        recommendations = []
        score = 100

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=10) as response:
                    html = await response.text()

                    # Анализ meta tags
                    meta_title = self._extract_meta_tag(html, 'title')
                    meta_description = self._extract_meta_tag(html, 'name="description"')
                    
                    if not meta_title:
                        issues.append({"type": "error", "message": "Отсутствует title"})
                        score -= 15
                    elif len(meta_title) < 30 or len(meta_title) > 60:
                        issues.append({"type": "warning", "message": f"Title слишком {'короткий' if len(meta_title) < 30 else 'длинный'} ({len(meta_title)} символов)"})
                        score -= 5

                    if not meta_description:
                        issues.append({"type": "error", "message": "Отсутствует meta description"})
                        score -= 10
                    elif len(meta_description) < 120 or len(meta_description) > 160:
                        issues.append({"type": "warning", "message": f"Description слишком {'короткий' if len(meta_description) < 120 else 'длинный'}"})
                        score -= 5

                    # Анализ заголовков
                    h1_count = len(re.findall(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL))
                    if h1_count == 0:
                        issues.append({"type": "error", "message": "Отсутствует H1 заголовок"})
                        score -= 15
                    elif h1_count > 1:
                        issues.append({"type": "warning", "message": f"Несколько H1 заголовков ({h1_count})"})
                        score -= 5

                    # Анализ изображений
                    images = re.findall(r'<img[^>]*>', html, re.IGNORECASE)
                    images_without_alt = [img for img in images if 'alt=' not in img.lower()]
                    if images_without_alt:
                        issues.append({"type": "warning", "message": f"{len(images_without_alt)} изображений без alt"})
                        score -= 5

                    # Анализ скорости загрузки (размер HTML)
                    html_size = len(html)
                    if html_size > 100000:
                        issues.append({"type": "warning", "message": f"Большой размер HTML ({html_size // 1024}KB)"})
                        score -= 5

                    # Мобильная адаптивность
                    viewport = self._extract_meta_tag(html, 'name="viewport"')
                    if not viewport:
                        issues.append({"type": "error", "message": "Нет viewport meta tag (не адаптирован для мобильных)"})
                        score -= 15

                    # Внутренние ссылки
                    internal_links = re.findall(r'href=["\']/(.*?)["\']', html)
                    if len(internal_links) < 5:
                        issues.append({"type": "warning", "message": "Мало внутренних ссылок"})
                        score -= 5

                    # Формируем рекомендации
                    recommendations = await self._generate_recommendations(issues, url)

        except Exception as e:
            logger.error(f"Ошибка SEO аудита: {e}")
            issues.append({"type": "error", "message": f"Ошибка анализа: {str(e)}"})
            score = 0

        audit = SEOAudit(
            url=url,
            score=max(0, score),
            issues=issues,
            recommendations=recommendations,
            timestamp=datetime.now()
        )
        self._audit_history.append(audit)

        return audit

    async def keyword_research(self, niche: str, region: str = "ru") -> List[KeywordRanking]:
        """
        Исследование ключевых слов

        Args:
            niche: Ниша/тематика
            region: Регион (ru, bg, us)

        Returns:
            Список ключевых слов с метриками
        """
        prompt = f"""
Ты — SEO эксперт. Проведи исследование ключевых слов для ниши: {niche}
Регион: {region}

Сгенерируй список из 20 релевантных ключевых слов с метриками.

Формат ответа — JSON массив:
[
  {{
    "keyword": "ключевое слово",
    "search_volume": 1000,
    "difficulty": 45,
    "cpc": 1.5,
    "intent": "informational|transactional|navigational"
  }}
]

Требования:
- Разные типы интента
- Включи long-tail запросы
- Учти региональные особенности
"""

        response = await self.ai_client.complete(
            system="Генерируй релевантные ключевые слова с реалистичными метриками. Только JSON.",
            user=prompt,
            mode="heavy"
        )

        # Парсим ответ
        keywords = self._parse_keywords(response)
        return keywords

    async def content_optimization(
        self,
        content: str,
        target_keywords: List[str]
    ) -> str:
        """
        Оптимизация контента под SEO

        Args:
            content: Исходный контент
            target_keywords: Целевые ключевые слова

        Returns:
            Оптимизированный контент
        """
        prompt = f"""
Ты — SEO копирайтер. Оптимизируй контент под ключевые слова.

ЦЕЛЕВЫЕ КЛЮЧЕВЫЕ СЛОВА:
{', '.join(target_keywords)}

ИСХОДНЫЙ КОНТЕНТ:
{content[:5000]}  # Ограничиваем длину

ЗАДАЧА:
1. Органично впиши ключевые слова
2. Оптимизируй заголовки (H1, H2, H3)
3. Добавь LSI слова
4. Улучши читаемость
5. Создай meta title и description

ФОРМАТ ОТВЕТА:
📊 Анализ текущего контента
🔑 Оптимальная плотность ключей
📝 Оптимизированный контент
🏷️ Meta title (50-60 символов)
📋 Meta description (150-160 символов)
💡 Дополнительные рекомендации
"""

        response = await self.ai_client.complete(
            system="Оптимизируй контент для поисковых систем, сохраняя читаемость для людей.",
            user=prompt,
            mode="heavy"
        )

        return response

    async def competitor_analysis(self, domain: str) -> CompetitorAnalysis:
        """Анализ конкурентов"""
        # В реальном проекте — интеграция с Ahrefs/Semrush API
        # Для примера — генерация через AI
        
        prompt = f"""
Проанализируй домен конкурента: {domain}

Сгенерируй реалистичные SEO метрики на основе тематики домена.

Формат ответа — JSON:
{{
  "domain": "{domain}",
  "authority": 45,
  "backlinks": 1500,
  "keywords": 350,
  "traffic": 12000,
  "top_keywords": ["ключ1", "ключ2"],
  "strengths": ["сильная сторона 1"],
  "weaknesses": ["слабая сторона 1"]
}}
"""

        response = await self.ai_client.complete(
            system="Анализируй конкурентов и генерируй реалистичные метрики. Только JSON.",
            user=prompt,
            mode="heavy"
        )

        # Парсим ответ
        try:
            import json
            data = json.loads(response)
            return CompetitorAnalysis(
                domain=data.get('domain', domain),
                authority=data.get('authority', 0),
                backlinks=data.get('backlinks', 0),
                keywords=data.get('keywords', 0),
                traffic=data.get('traffic', 0)
            )
        except:
            return CompetitorAnalysis(domain=domain, authority=0, backlinks=0, keywords=0, traffic=0)

    async def geo_ai_optimization(self, business_type: str, location: str) -> Dict:
        """
        GEO AI оптимизация (локальное SEO)

        Args:
            business_type: Тип бизнеса
            location: Локация

        Returns:
            Рекомендации по локальному SEO
        """
        prompt = f"""
Ты — эксперт по локальному SEO (GEO AI).

БИЗНЕС: {business_type}
ЛОКАЦИЯ: {location}

Создай стратегию продвижения в локальном поиске.

ПЛАН:
1. **Google My Business оптимизация**
   - Название, описание, категории
   - Фотографии
   - Отзывы

2. **Локальные ключевые слова**
   - Geo-модифицированные запросы
   - "Near me" запросы

3. **Локальные ссылки**
   - Справочники
   - Партнёры
   - СМИ

4. **Контент стратегия**
   - Локальные новости
   - События
   - Кейсы

5. **Отзывы и репутация**
   - Стратегия получения
   - Ответы на отзывы

Верни структурированный план с конкретными шагами.
"""

        response = await self.ai_client.complete(
            system="Создавай практические планы по локальному SEO продвижению.",
            user=prompt,
            mode="heavy"
        )

        return {"strategy": response}

    async def track_rankings(self, keywords: List[str], domain: str):
        """Отслеживание позиций в реальном времени"""
        logger.info(f"🔍 Отслеживание позиций: {len(keywords)} ключей")

        rankings = []
        for keyword in keywords:
            # В реальном проекте — парсинг SERP или API
            ranking = KeywordRanking(
                keyword=keyword,
                position=0,  # Будет заполнено при реальном отслеживании
                url=domain,
                search_volume=0,
                difficulty=0,
                cpc=0.0
            )
            rankings.append(ranking)

        self._tracked_keywords[domain] = rankings
        return rankings

    def _extract_meta_tag(self, html: str, tag_pattern: str) -> str:
        """Извлечение meta тега"""
        match = re.search(f'<{tag_pattern}[^>]*content=["\'](.*?)["\']', html, re.IGNORECASE)
        if match:
            return match.group(1)
        
        # Альтернативный паттерн
        match = re.search(f'<{tag_pattern}[^>]*>(.*?)</', html, re.IGNORECASE)
        if match:
            return match.group(1)
        
        return ""

    async def _generate_recommendations(
        self,
        issues: List[Dict],
        url: str
    ) -> List[str]:
        """Генерация рекомендаций по аудиту"""
        if not issues:
            return ["Отличная работа! Продолжайте в том же духе."]

        issue_summary = "\n".join([f"- {i['message']}" for i in issues])
        
        prompt = f"""
На основе проблем сайта {url}, создай рекомендации по исправлению.

ПРОБЛЕМЫ:
{issue_summary}

Создай список конкретных действий по приоритету:
🔴 Критические (исправить немедленно)
🟡 Важные (исправить в течение недели)
🟢 Желательные (улучшения)
"""

        response = await self.ai_client.complete(
            system="Давай конкретные рекомендации по исправлению SEO проблем.",
            user=prompt,
            mode="fast"
        )

        return response.split("\n")

    def _parse_keywords(self, response: str) -> List[KeywordRanking]:
        """Парсинг ключевых слов из ответа AI"""
        import json
        try:
            data = json.loads(response)
            keywords = []
            for item in data:
                kw = KeywordRanking(
                    keyword=item.get('keyword', ''),
                    position=0,
                    url='',
                    search_volume=item.get('search_volume', 0),
                    difficulty=item.get('difficulty', 0),
                    cpc=item.get('cpc', 0.0)
                )
                keywords.append(kw)
            return keywords
        except:
            return []


# Глобальный экземпляр
ai_seo_expert: Optional[AISEOExpert] = None


def init_ai_seo_expert(ai_client):
    """Инициализация AI SEO эксперта"""
    global ai_seo_expert
    ai_seo_expert = AISEOExpert(ai_client)
    logger.info("✅ AI SEO Эксперт инициализирован")
    return ai_seo_expert
