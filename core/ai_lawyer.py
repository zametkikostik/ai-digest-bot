"""
AI Юрист — Законы России и Болгарии
Иммиграция, адаптация, отслеживание изменений законодательства
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import aiohttp

logger = logging.getLogger(__name__)


class Country(Enum):
    """Страны"""
    RUSSIA = "ru"
    BULGARIA = "bg"
    EU = "eu"  # Европейский Союз


class LegalArea(Enum):
    """Области права"""
    CIVIL = "civil"  # Гражданское
    CRIMINAL = "criminal"  # Уголовное
    ADMINISTRATIVE = "administrative"  # Административное
    LABOR = "labor"  # Трудовое
    FAMILY = "family"  # Семейное
    TAX = "tax"  # Налоговое
    IMMIGRATION = "immigration"  # Иммиграционное
    BUSINESS = "business"  # Бизнес/Корпоративное
    REAL_ESTATE = "real_estate"  # Недвижимость
    INTELLECTUAL_PROPERTY = "ip"  # Интеллектуальная собственность


@dataclass
class LawArticle:
    """Статья закона"""
    id: str
    country: Country
    area: LegalArea
    code_name: str  # Название кодекса
    article_number: str  # Номер статьи
    title: str
    content: str
    last_updated: datetime
    is_active: bool


@dataclass
class LegalConsultation:
    """Юридическая консультация"""
    user_id: int
    question: str
    answer: str
    country: Country
    area: LegalArea
    articles_referenced: List[str]
    timestamp: datetime
    is_premium: bool


class AILawyer:
    """AI Юрист для консультаций по законам"""

    def __init__(self, ai_client):
        self.ai_client = ai_client
        self._laws_db: Dict[Country, Dict[LegalArea, List[LawArticle]]] = {}
        self._legal_updates: Dict[str, datetime] = {}
        self._consultations: List[LegalConsultation] = []
        
        # Инициализация базы законов
        self._initialize_laws()

    def _initialize_laws(self):
        """Инициализация базы законов"""
        
        # РОССИЯ
        self._laws_db[Country.RUSSIA] = {
            LegalArea.CIVIL: [
                LawArticle(
                    id="ru_civil_1",
                    country=Country.RUSSIA,
                    area=LegalArea.CIVIL,
                    code_name="Гражданский кодекс РФ",
                    article_number="Статья 1",
                    title="Основные начала гражданского законодательства",
                    content="Гражданское законодательство основывается на признании равенства участников...",
                    last_updated=datetime.now(),
                    is_active=True
                ),
                # ГК РФ - основные статьи
            ],
            LegalArea.LABOR: [
                LawArticle(
                    id="ru_labor_1",
                    country=Country.RUSSIA,
                    area=LegalArea.LABOR,
                    code_name="Трудовой кодекс РФ",
                    article_number="Статья 21",
                    title="Основные права и обязанности работника",
                    content="Работник имеет право на заключение, изменение и расторжение ТД...",
                    last_updated=datetime.now(),
                    is_active=True
                ),
            ],
            LegalArea.TAX: [
                LawArticle(
                    id="ru_tax_1",
                    country=Country.RUSSIA,
                    area=LegalArea.TAX,
                    code_name="Налоговый кодекс РФ",
                    article_number="Статья 1",
                    title="Законодательство о налогах и сборах",
                    content="Налоговое законодательство состоит из НК РФ...",
                    last_updated=datetime.now(),
                    is_active=True
                ),
            ],
            LegalArea.FAMILY: [
                LawArticle(
                    id="ru_family_1",
                    country=Country.RUSSIA,
                    area=LegalArea.FAMILY,
                    code_name="Семейный кодекс РФ",
                    article_number="Статья 1",
                    title="Семейное законодательство",
                    content="Семейное законодательство исходит из необходимости укрепления семьи...",
                    last_updated=datetime.now(),
                    is_active=True
                ),
            ],
            LegalArea.IMMIGRATION: [
                LawArticle(
                    id="ru_immigration_1",
                    country=Country.RUSSIA,
                    area=LegalArea.IMMIGRATION,
                    code_name="ФЗ «О правовом положении иностранных граждан»",
                    article_number="Статья 6",
                    title="Виды на жительство",
                    content="Иностранный гражданин может получить РВП, ВНЖ или гражданство...",
                    last_updated=datetime.now(),
                    is_active=True
                ),
            ],
            LegalArea.ADMINISTRATIVE: [
                LawArticle(
                    id="ru_admin_1",
                    country=Country.RUSSIA,
                    area=LegalArea.ADMINISTRATIVE,
                    code_name="Кодекс об административных правонарушениях РФ",
                    article_number="Статья 1.1",
                    title="Законодательство об административных правонарушениях",
                    content="Законодательство об административных правонарушениях состоит из КоАП РФ...",
                    last_updated=datetime.now(),
                    is_active=True
                ),
            ],
            LegalArea.CRIMINAL: [
                LawArticle(
                    id="ru_criminal_1",
                    country=Country.RUSSIA,
                    area=LegalArea.CRIMINAL,
                    code_name="Уголовный кодекс РФ",
                    article_number="Статья 1",
                    title="Уголовное законодательство",
                    content="Уголовное законодательство РФ состоит из УК РФ...",
                    last_updated=datetime.now(),
                    is_active=True
                ),
            ],
            LegalArea.BUSINESS: [
                LawArticle(
                    id="ru_business_1",
                    country=Country.RUSSIA,
                    area=LegalArea.BUSINESS,
                    code_name="ФЗ «Об обществах с ограниченной ответственностью»",
                    article_number="Статья 1",
                    title="Общие положения",
                    content="Обществом с ограниченной ответственностью признаётся хозяйственное общество...",
                    last_updated=datetime.now(),
                    is_active=True
                ),
            ],
        }

        # БОЛГАРИЯ
        self._laws_db[Country.BULGARIA] = {
            LegalArea.CIVIL: [
                LawArticle(
                    id="bg_civil_1",
                    country=Country.BULGARIA,
                    area=LegalArea.CIVIL,
                    code_name="Закон за задълженията и договорите",
                    article_number="Член 1",
                    title="Основи на договорното право",
                    content="Задълженията произтичат от договора, от закона...",
                    last_updated=datetime.now(),
                    is_active=True
                ),
            ],
            LegalArea.LABOR: [
                LawArticle(
                    id="bg_labor_1",
                    country=Country.BULGARIA,
                    area=LegalArea.LABOR,
                    code_name="Кодекс на труда",
                    article_number="Член 1",
                    title="Общи разпоредби",
                    content="Кодексът на труда урежда трудовите отношения...",
                    last_updated=datetime.now(),
                    is_active=True
                ),
            ],
            LegalArea.IMMIGRATION: [
                LawArticle(
                    id="bg_immigration_1",
                    country=Country.BULGARIA,
                    area=LegalArea.IMMIGRATION,
                    code_name="Закон за чужденците в Република България",
                    article_number="Член 24",
                    title="Видове разрешителни за пребиваване",
                    content="Чужденец може да получи краткосрочно, дългосрочно или постоянно пребиваване...",
                    last_updated=datetime.now(),
                    is_active=True
                ),
            ],
            LegalArea.TAX: [
                LawArticle(
                    id="bg_tax_1",
                    country=Country.BULGARIA,
                    area=LegalArea.TAX,
                    code_name="Закон за корпоративното подоходно облагане",
                    article_number="Член 1",
                    title="Приложно поле",
                    content="Данъкът се дължи от всички търговски дружества...",
                    last_updated=datetime.now(),
                    is_active=True
                ),
            ],
            LegalArea.REAL_ESTATE: [
                LawArticle(
                    id="bg_realestate_1",
                    country=Country.BULGARIA,
                    area=LegalArea.REAL_ESTATE,
                    code_name="Закон за собствеността",
                    article_number="Член 1",
                    title="Право на собственост",
                    content="Правото на собственост е неприкосновено...",
                    last_updated=datetime.now(),
                    is_active=True
                ),
            ],
            LegalArea.CRIMINAL: [
                LawArticle(
                    id="bg_criminal_1",
                    country=Country.BULGARIA,
                    area=LegalArea.CRIMINAL,
                    code_name="Наказателен кодекс на Република България",
                    article_number="Член 1",
                    title="Предмет на наказателния кодекс",
                    content="Наказателният кодекс урежда основанията и условията за наказателна отговорност...",
                    last_updated=datetime.now(),
                    is_active=True
                ),
                LawArticle(
                    id="bg_criminal_2",
                    country=Country.BULGARIA,
                    area=LegalArea.CRIMINAL,
                    code_name="Наказателен кодекс",
                    article_number="Член 19",
                    title="Видове наказания",
                    content="Наказанията в Република България са: лишаване от свобода, доживотен затвор, глоба...",
                    last_updated=datetime.now(),
                    is_active=True
                ),
                LawArticle(
                    id="bg_criminal_3",
                    country=Country.BULGARIA,
                    area=LegalArea.CRIMINAL,
                    code_name="Наказателен кодекс",
                    article_number="Член 115",
                    title="Убийство",
                    content="Който убие друг човек, се наказва с лишаване от свобода от десет до двадесет години...",
                    last_updated=datetime.now(),
                    is_active=True
                ),
                LawArticle(
                    id="bg_criminal_4",
                    country=Country.BULGARIA,
                    area=LegalArea.CRIMINAL,
                    code_name="Наказателен кодекс",
                    article_number="Член 194",
                    title="Кражба",
                    content="Който отнеме чужда вещ с намерение незаконно да я присвои, се наказва за кражба...",
                    last_updated=datetime.now(),
                    is_active=True
                ),
                LawArticle(
                    id="bg_criminal_5",
                    country=Country.BULGARIA,
                    area=LegalArea.CRIMINAL,
                    code_name="Наказателен кодекс",
                    article_number="Член 212",
                    title="Измама",
                    content="Който чрез представяне на неверни факти или чрез премълчаване на истинни факти...",
                    last_updated=datetime.now(),
                    is_active=True
                ),
            ],
        }

    async def consult(
        self,
        user_id: int,
        question: str,
        country: Optional[Country] = None,
        area: Optional[LegalArea] = None,
        is_premium: bool = False
    ) -> str:
        """
        Юридическая консультация

        Args:
            user_id: ID пользователя
            question: Вопрос
            country: Страна (если определена)
            area: Область права
            is_premium: Premium доступ

        Returns:
            str: Консультация
        """
        # Определяем страну и область если не указаны
        if not country:
            country = await self._detect_country(question)
        
        if not area:
            area = await self._detect_legal_area(question)

        # Получаем релевантные статьи
        relevant_articles = self._find_relevant_articles(country, area, question)

        # Формируем промпт
        country_name = "России" if country == Country.RUSSIA else "Болгарии"
        area_name = self._get_area_name(area)

        prompt = f"""
Ты — профессиональный юрист, специализирующийся на законодательстве {country_name}.
Область права: {area_name}

ВОПРОС КЛИЕНТА:
{question}

ЗАДАЧА:
1. Дай подробную юридическую консультацию
2. Ссылайся на конкретные статьи законов
3. Объясняй сложные термины простым языком
4. Укажи возможные риски и нюансы
5. Дай практические рекомендации
6. Если вопрос требует уточнения — задай вопросы

СТРУКТУРА ОТВЕТА:
📋 Краткий ответ (2-3 предложения)
⚖️ Применимые законы и статьи
📖 Подробное объяснение
⚠️ Риски и нюансы
💡 Практические рекомендации
❓ Что делать дальше

ВАЖНО:
- Это общая информация, не заменяет очную консультацию
- Законы могут меняться — проверяй актуальность
- Если не уверен — скажи об этом
"""

        response = await self.ai_client.complete(
            system=f"Ты — опытный юрист по законодательству {country_name}. Давай точные консультации со ссылками на законы.",
            user=prompt,
            mode="heavy"
        )

        # Добавляем ссылки на статьи
        if relevant_articles:
            articles_text = "\n\n📚 **Нормативные акты**:\n"
            for article in relevant_articles[:5]:
                articles_text += f"• {article.code_name}, {article.article_number}: {article.title}\n"
            response += articles_text

        # Сохраняем консультацию
        self._save_consultation(user_id, question, response, country, area, is_premium)

        return response

    async def immigration_help(
        self,
        user_id: int,
        from_country: str,
        to_country: Country,
        purpose: str,
        is_premium: bool = False
    ) -> str:
        """
        Помощь с иммиграцией и адаптацией

        Args:
            user_id: ID пользователя
            from_country: Страна происхождения
            to_country: Страна назначения
            purpose: Цель (работа, учёба, бизнес, воссоединение)
            is_premium: Premium доступ

        Returns:
            str: Руководство по иммиграции
        """
        to_country_name = "Россию" if to_country == Country.RUSSIA else "Болгарию"

        prompt = f"""
Ты — эксперт по иммиграции в {to_country_name}.

СИТУАЦИЯ:
- Страна происхождения: {from_country}
- Страна назначения: {to_country_name}
- Цель переезда: {purpose}

ЗАДАЧА:
Создай подробное руководство по переезду и адаптации.

СТРУКТУРА:
🛂 Визовые требования
   • Типы виз
   • Необходимые документы
   • Сроки рассмотрения
   • Стоимость

📋 Вид на жительство
   • Основания для получения
   • Пакет документов
   • Процедура подачи
   • Сроки действия

🏠 Адаптация
   • Поиск жилья
   • Регистрация
   • Банковские счета
   • Медицинская страховка

💼 Работа/Учёба/Бизнес
   • Разрешения
   • Требования
   • Возможности

📞 Полезные контакты
   • Миграционные службы
   • Посольства
   • Организации помощи

⚠️ Важные нюансы
   • Частые ошибки
   • Советы по успешной адаптации

{'💡 PREMIUM: Персональные рекомендации и проверка документов' if is_premium else ''}
"""

        response = await self.ai_client.complete(
            system="Ты — эксперт по иммиграции. Давай практические руководства по переезду.",
            user=prompt,
            mode="heavy"
        )

        return response

    async def track_legal_updates(self, country: Country, area: LegalArea):
        """
        Отслеживание изменений законодательства
        Мониторинг официальных источников
        """
        logger.info(f"🔄 Проверка изменений: {country.value}, {area.value}")

        try:
            async with aiohttp.ClientSession() as session:
                if country == Country.RUSSIA:
                    # КонсультантПлюс, Гарант, pravo.gov.ru
                    updates = await self._check_russia_updates(session, area)
                elif country == Country.BULGARIA:
                    # lex.bg, dv.parliament.bg
                    updates = await self._check_bulgaria_updates(session, area)
                else:
                    updates = []

                if updates:
                    logger.info(f"✅ Найдено {len(updates)} обновлений")
                    await self._process_updates(country, area, updates)

        except Exception as e:
            logger.error(f"Ошибка отслеживания законов: {e}")

    async def _check_russia_updates(
        self,
        session: aiohttp.ClientSession,
        area: LegalArea
    ) -> List[Dict]:
        """Проверка обновлений в России"""
        # Упрощённая проверка (в продакшене — парсинг реальных источников)
        sources = {
            LegalArea.CIVIL: "http://pravo.gov.ru/",
            LegalArea.TAX: "https://www.nalog.ru/",
            LegalArea.LABOR: "https://www.rostrud.ru/",
        }
        
        # В реальном проекте здесь будет парсинг
        return []

    async def _check_bulgaria_updates(
        self,
        session: aiohttp.ClientSession,
        area: LegalArea
    ) -> List[Dict]:
        """Проверка обновлений в Болгарии"""
        # Упрощённая проверка
        sources = {
            LegalArea.CIVIL: "https://lex.bg/",
            LegalArea.TAX: "https://www.nap.bg/",
        }
        
        return []

    async def _process_updates(
        self,
        country: Country,
        area: LegalArea,
        updates: List[Dict]
    ):
        """Обработка найденных обновлений"""
        for update in updates:
            # Обновляем базу законов
            logger.info(f"📝 Обновление: {update.get('title', '')}")

    def _find_relevant_articles(
        self,
        country: Country,
        area: LegalArea,
        question: str
    ) -> List[LawArticle]:
        """Поиск релевантных статей"""
        articles = self._laws_db.get(country, {}).get(area, [])
        
        # Простой поиск по ключевым словам
        question_lower = question.lower()
        relevant = []
        
        for article in articles:
            if (article.title.lower() in question_lower or
                article.code_name.lower() in question_lower or
                article.article_number in question_lower):
                relevant.append(article)
        
        return relevant

    async def _detect_country(self, question: str) -> Country:
        """Определение страны по вопросу"""
        question_lower = question.lower()
        
        if any(word in question_lower for word in ['росси', 'рф', 'российск', 'москв', 'спб']):
            return Country.RUSSIA
        elif any(word in question_lower for word in ['болгар', 'софи', 'варн', 'пловдив']):
            return Country.BULGARIA
        else:
            return Country.RUSSIA  # По умолчанию

    async def _detect_legal_area(self, question: str) -> LegalArea:
        """Определение области права по вопросу"""
        question_lower = question.lower()
        
        keywords = {
            LegalArea.FAMILY: ['семейн', 'брак', 'развод', 'алимент', 'ребёнк', 'дет'],
            LegalArea.LABOR: ['работ', 'труд', 'зарплат', 'увольн', 'отпуск', 'сотрудник'],
            LegalArea.TAX: ['налог', 'ндфл', 'усн', 'осно', 'деклараци', 'взнос'],
            LegalArea.CIVIL: ['договор', 'сделк', 'собственност', 'имуществ', 'аренд'],
            LegalArea.CRIMINAL: ['преступлен', 'уголовн', 'наказан', 'следстви'],
            LegalArea.IMMIGRATION: ['виз', 'миграц', 'рвп', 'внж', 'гражданств', 'переезд'],
            LegalArea.BUSINESS: ['бизнес', 'ооо', 'ип', 'предпринимат', 'компани'],
            LegalArea.REAL_ESTATE: ['недвижим', 'квартир', 'дом', 'земель', 'строительств'],
        }
        
        for area, words in keywords.items():
            if any(word in question_lower for word in words):
                return area
        
        return LegalArea.CIVIL  # По умолчанию

    def _get_area_name(self, area: LegalArea) -> str:
        """Название области права на русском"""
        names = {
            LegalArea.CIVIL: "Гражданское право",
            LegalArea.CRIMINAL: "Уголовное право",
            LegalArea.ADMINISTRATIVE: "Административное право",
            LegalArea.LABOR: "Трудовое право",
            LegalArea.FAMILY: "Семейное право",
            LegalArea.TAX: "Налоговое право",
            LegalArea.IMMIGRATION: "Иммиграционное право",
            LegalArea.BUSINESS: "Корпоративное право",
            LegalArea.REAL_ESTATE: "Право недвижимости",
            LegalArea.INTELLECTUAL_PROPERTY: "Интеллектуальная собственность",
        }
        return names.get(area, "Право")

    def _save_consultation(
        self,
        user_id: int,
        question: str,
        answer: str,
        country: Country,
        area: LegalArea,
        is_premium: bool
    ):
        """Сохранение консультации"""
        consultation = LegalConsultation(
            user_id=user_id,
            question=question,
            answer=answer,
            country=country,
            area=area,
            articles_referenced=[],
            timestamp=datetime.now(),
            is_premium=is_premium
        )
        self._consultations.append(consultation)

    def get_consultation_history(
        self,
        user_id: int,
        limit: int = 10
    ) -> List[LegalConsultation]:
        """История консультаций пользователя"""
        user_consultations = [c for c in self._consultations if c.user_id == user_id]
        return user_consultations[-limit:]


# Глобальный экземпляр
ai_lawyer: Optional[AILawyer] = None


def init_ai_lawyer(ai_client):
    """Инициализация AI юриста"""
    global ai_lawyer
    ai_lawyer = AILawyer(ai_client)
    logger.info("✅ AI Юрист инициализирован")
    return ai_lawyer
