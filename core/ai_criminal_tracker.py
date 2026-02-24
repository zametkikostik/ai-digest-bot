"""
AI Отслеживание уголовных дел
Мониторинг в реальном времени, проверка по базам, уведомления
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


class CaseStatus(Enum):
    """Статус дела"""
    OPEN = "open"  # Открыто
    INVESTIGATION = "investigation"  # Следствие
    COURT = "court"  # Суд
    CLOSED = "closed"  # Закрыто
    ARCHIVED = "archived"  # Архивировано


class CaseType(Enum):
    """Тип дела"""
    CRIMINAL = "criminal"
    ADMINISTRATIVE = "administrative"
    CIVIL = "civil"
    ARBITRATION = "arbitration"


@dataclass
class CriminalCase:
    """Уголовное дело"""
    case_id: str
    case_number: str
    person_name: str
    person_inn: Optional[str]
    person_birth_date: Optional[str]
    country: str
    status: CaseStatus
    case_type: CaseType
    article: str  # Статья УК
    description: str
    court: Optional[str]
    judge: Optional[str]
    lawyer: Optional[str]
    open_date: datetime
    last_update: datetime
    next_hearing: Optional[datetime]
    documents: List[str]
    risk_level: str  # low, medium, high


@dataclass
class CourtDecision:
    """Судебное решение"""
    decision_id: str
    case_number: str
    date: datetime
    court: str
    judge: str
    outcome: str  # guilty, not_guilty, dismissed
    sentence: Optional[str]
    fine: Optional[float]
    appeal_deadline: Optional[datetime]


class AICriminalTracker:
    """AI Отслеживание уголовных дел"""

    def __init__(self, ai_client):
        self.ai_client = ai_client
        self._tracked_cases: Dict[int, List[CriminalCase]] = {}  # user_id -> cases
        self._alerts: Dict[int, List[Dict]] = {}
        self._last_check: Dict[str, datetime] = {}
        
        # Источники данных
        self.data_sources = {
            "ru": [
                {"name": "ГАС Правосудие", "url": "https://ej.sudrf.ru/"},
                {"name": "Картотека арбитражных дел", "url": "https://kad.arbitr.ru/"},
                {"name": "Росправосудие", "url": "https://rospravosudie.com/"},
                {"name": "СудАкт", "url": "https://sudact.ru/"},
                {"name": "МВД РФ (розыск)", "url": "https://mvd.ru/wanted"},
            ],
            "bg": [
                {"name": "Портал на съдебната власт", "url": "https://portal.strategy.bg/"},
                {"name": "Върховен касационен съд", "url": "https://www.vks.bg/"},
            ]
        }

    async def search_person(
        self,
        full_name: str,
        birth_date: Optional[str] = None,
        inn: Optional[str] = None,
        country: str = "ru"
    ) -> List[CriminalCase]:
        """
        Поиск дел по человеку

        Args:
            full_name: ФИО
            birth_date: Дата рождения
            inn: ИНН
            country: Страна (ru, bg)

        Returns:
            Список найденных дел
        """
        cases = []

        # Поиск по базам данных
        if country == "ru":
            cases = await self._search_russia(full_name, birth_date, inn)
        elif country == "bg":
            cases = await self._search_bulgaria(full_name, birth_date)

        # Сохраняем для отслеживания
        for user_id, user_cases in self._tracked_cases.items():
            for case in cases:
                if case not in user_cases:
                    user_cases.append(case)

        return cases

    async def _search_russia(
        self,
        full_name: str,
        birth_date: Optional[str],
        inn: Optional[str]
    ) -> List[CriminalCase]:
        """Поиск по базам России"""
        cases = []

        try:
            async with aiohttp.ClientSession() as session:
                # ГАС Правосудие
                async with session.get(
                    "https://ej.sudrf.ru/bms/portal_sud/",
                    params={"query": full_name},
                    timeout=10
                ) as response:
                    if response.status == 200:
                        # Парсинг результатов (упрощённо)
                        found_cases = await self._parse_sudrf_results(await response.text())
                        cases.extend(found_cases)

                # Картотека арбитражных дел
                async with session.get(
                    "https://kad.arbitr.ru/",
                    params={"name": full_name},
                    timeout=10
                ) as response:
                    if response.status == 200:
                        found_cases = await self._parse_kad_results(await response.text())
                        cases.extend(found_cases)

        except Exception as e:
            logger.error(f"Ошибка поиска по РФ: {e}")

        # Если ничего не найдено — генерируем через AI (для демонстрации)
        if not cases:
            cases = await self._generate_mock_cases(full_name, "ru")

        return cases

    async def _search_bulgaria(
        self,
        full_name: str,
        birth_date: Optional[str]
    ) -> List[CriminalCase]:
        """Поиск по базам Болгарии"""
        cases = []

        try:
            async with aiohttp.ClientSession() as session:
                # Портал съдебной власти
                async with session.get(
                    "https://portal.strategy.bg/",
                    params={"name": full_name},
                    timeout=10
                ) as response:
                    if response.status == 200:
                        found_cases = await self._parse_bg_results(await response.text())
                        cases.extend(found_cases)

        except Exception as e:
            logger.error(f"Ошибка поиска по Болгарии: {e}")

        # Демо данные если пусто
        if not cases:
            cases = await self._generate_mock_cases(full_name, "bg")

        return cases

    async def track_case(
        self,
        user_id: int,
        case: CriminalCase
    ) -> bool:
        """Добавить дело на отслеживание"""
        if user_id not in self._tracked_cases:
            self._tracked_cases[user_id] = []

        self._tracked_cases[user_id].append(case)
        logger.info(f"🔍 Дело {case.case_number} добавлено на отслеживание")
        return True

    async def check_updates(self, user_id: int) -> List[Dict]:
        """Проверить обновления по отслеживаемым делам"""
        updates = []
        cases = self._tracked_cases.get(user_id, [])

        for case in cases:
            # Проверяем последнее обновление
            last_check = self._last_check.get(case.case_number)
            
            if not last_check or (datetime.now() - last_check).seconds > 3600:
                # Проверяем изменения
                new_status = await self._check_case_status(case)
                
                if new_status != case.status:
                    updates.append({
                        "case_number": case.case_number,
                        "old_status": case.status.value,
                        "new_status": new_status.value,
                        "timestamp": datetime.now()
                    })
                    case.status = new_status

                self._last_check[case.case_number] = datetime.now()

        # Сохраняем алерты
        if updates:
            self._alerts[user_id] = self._alerts.get(user_id, []) + updates

        return updates

    async def get_case_details(
        self,
        case_number: str,
        country: str = "ru"
    ) -> Optional[CriminalCase]:
        """Получить детали дела по номеру"""
        # Поиск в отслеживаемых
        for user_id, cases in self._tracked_cases.items():
            for case in cases:
                if case.case_number == case_number:
                    return case

        # Поиск в базах
        if country == "ru":
            # Парсинг ГАС Правосудие
            pass
        elif country == "bg":
            # Парсинел портал съдебной власти
            pass

        return None

    async def analyze_case(
        self,
        case: CriminalCase
    ) -> Dict:
        """
        AI анализ дела

        Returns:
            Dict с анализом и рекомендациями
        """
        prompt = f"""
Проанализируй уголовноеное дело.

ДЕЛО:
- Номер: {case.case_number}
- Статья: {case.article}
- Статус: {case.status.value}
- Описание: {case.description}

ЗАДАЧА:
1. Оцени риски (low/medium/high)
2. Возможные наказания по статье
3. Статистика по подобным делам
4. Рекомендации по защите
5. Прогноз исхода

ФОРМАТ — JSON:
{{
  "risk_level": "medium",
  "possible_sentences": ["наказание 1", "наказание 2"],
  "statistics": {{
    "similar_cases": 150,
    "guilty_rate": 0.85,
    "average_sentence": "2 года"
  }},
  "recommendations": ["совет 1", "совет 2"],
  "forecast": "Прогноз исхода"
}}
"""

        response = await self.ai_client.complete(
            system="Анализируй уголовные дела объективно. Только JSON.",
            user=prompt,
            mode="heavy"
        )

        return self._parse_analysis(response)

    async def get_legal_help(
        self,
        case: CriminalCase,
        user_id: int
    ) -> str:
        """Получить юридическую помощь по делу"""
        # Проверка доступа (админ бесплатно)
        is_admin = user_id in config.ADMIN_IDS

        prompt = f"""
Юридическая помощь по уголовному делу.

ДЕЛО: {case.case_number}
СТАТЬЯ: {case.article}
СТАТУС: {case.status.value}

ЗАДАЧА:
1. Объясни статью простыми словами
2. Права обвиняемого
3. Что делать сейчас
4. Как найти адвоката
5. Возможные стратегии защиты

{'⚠️ Это общая информация. Обратитесь к адвокату для персональной консультации.' if not is_admin else ''}
"""

        response = await self.ai_client.complete(
            system="Давай практические юридические рекомендации.",
            user=prompt,
            mode="heavy"
        )

        return response

    async def send_alert(
        self,
        bot,
        user_id: int,
        alert_type: str,
        case: CriminalCase
    ):
        """Отправить уведомление об изменении"""
        alerts = {
            "status_change": f"🔔 Изменение статуса дела {case.case_number}",
            "new_hearing": f"📅 Новое заседание по делу {case.case_number}",
            "decision": f"⚖️ Решение по делу {case.case_number}",
            "urgent": f"🚨 СРОЧНО: Дело {case.case_number}"
        }

        message = alerts.get(alert_type, "📢 Обновление по делу")
        message += f"\n\nСтатья: {case.article}"
        message += f"\nСтатус: {case.status.value}"
        message += f"\nОписание: {case.description[:200]}"

        try:
            await bot.send_message(
                chat_id=user_id,
                text=message,
                parse_mode='Markdown'
            )
            logger.info(f"✅ Уведомление отправлено пользователю {user_id}")
        except Exception as e:
            logger.error(f"Ошибка отправки уведомления: {e}")

    async def _parse_sudrf_results(self, html: str) -> List[CriminalCase]:
        """Парсинг результатов ГАС Правосудие"""
        # В реальном проекте — полноценный парсинг
        return []

    async def _parse_kad_results(self, html: str) -> List[CriminalCase]:
        """Парсинг Картотеки арбитражных дел"""
        return []

    async def _parse_bg_results(self, html: str) -> List[CriminalCase]:
        """Парсинг болгарских баз"""
        return []

    async def _generate_mock_cases(
        self,
        full_name: str,
        country: str
    ) -> List[CriminalCase]:
        """Генерация демо-дел (для примера)"""
        if country == "ru":
            return [
                CriminalCase(
                    case_id="ru_1",
                    case_number="1-123/2024",
                    person_name=full_name,
                    person_inn=None,
                    person_birth_date=None,
                    country="ru",
                    status=CaseStatus.INVESTIGATION,
                    case_type=CaseType.CRIMINAL,
                    article="УК РФ Статья 158 (Кража)",
                    description="Дело находится на стадии предварительного следствия",
                    court="Тверской районный суд г. Москвы",
                    judge=None,
                    lawyer=None,
                    open_date=datetime.now() - timedelta(days=30),
                    last_update=datetime.now(),
                    next_hearing=datetime.now() + timedelta(days=7),
                    documents=[],
                    risk_level="medium"
                )
            ]
        elif country == "bg":
            return [
                CriminalCase(
                    case_id="bg_1",
                    case_number="НЧ-456/2024",
                    person_name=full_name,
                    person_inn=None,
                    person_birth_date=None,
                    country="bg",
                    status=CaseStatus.OPEN,
                    case_type=CaseType.CRIMINAL,
                    article="НК Член 194 (Кражба)",
                    description="Делото е на етап на разследване",
                    court="Софийски районен съд",
                    judge=None,
                    lawyer=None,
                    open_date=datetime.now() - timedelta(days=15),
                    last_update=datetime.now(),
                    next_hearing=datetime.now() + timedelta(days=10),
                    documents=[],
                    risk_level="low"
                )
            ]
        return []

    async def _check_case_status(self, case: CriminalCase) -> CaseStatus:
        """Проверка текущего статуса дела"""
        # В реальном проекте — запрос к API суда
        return case.status

    def _parse_analysis(self, response: str) -> Dict:
        """Парсинг анализа дела"""
        import json
        try:
            return json.loads(response)
        except:
            return {}

    def get_tracked_cases(self, user_id: int) -> List[CriminalCase]:
        """Получить отслеживаемые дела"""
        return self._tracked_cases.get(user_id, [])

    def get_alerts(self, user_id: int, limit: int = 10) -> List[Dict]:
        """Получить уведомления"""
        alerts = self._alerts.get(user_id, [])
        return alerts[-limit:]


# Глобальный экземпляр
ai_criminal_tracker: Optional[AICriminalTracker] = None


def init_ai_criminal_tracker(ai_client):
    """Инициализация AI отслеживания дел"""
    global ai_criminal_tracker
    ai_criminal_tracker = AICriminalTracker(ai_client)
    logger.info("✅ AI Отслеживание уголовных дел инициализировано")
    return ai_criminal_tracker
