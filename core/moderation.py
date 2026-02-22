"""
Модуль модерации сообщений
"""
import re
import logging
from dataclasses import dataclass
from typing import Optional
from core.ai_client import OpenRouterClient

logger = logging.getLogger(__name__)


@dataclass
class ModerationResult:
    """Результат модерации"""
    action: str  # allow | warn | delete | ban
    reason: str
    confidence: float


# Быстрые правила (без AI)
SPAM_PATTERNS = [
    r'https?://\S+',                    # Ссылки
    r'@[a-zA-Z0-9_]{5,}',               # Упоминания каналов
    r'💰|💵|💎|🎰|🎲',                   # Эмодзи азартных игр
    r'(заработ|казино|крипто|инвест|схем).{0,30}(денег|прибыль|доход)',
    r'(18\+|порно|секс|эротика)',
    r'(купить|продам|услуги).{0,20}(телеграм|канал|бот)',
    r'\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b',  # Email
]

FLOOD_THRESHOLD = 5  # Максимум повторений подряд


def check_spam_patterns(text: str) -> Optional[ModerationResult]:
    """
    Проверка на спам по быстрым паттернам
    
    Returns:
        ModerationResult если найден спам, None если чисто
    """
    for pattern in SPAM_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            logger.debug(f"Спам-паттерн найден: {pattern}")
            return ModerationResult(
                action="delete",
                reason=f"Spam pattern detected: {pattern[:30]}",
                confidence=0.95
            )
    return None


def check_flood(text: str, previous_messages: list[str]) -> Optional[ModerationResult]:
    """
    Проверка на флуд (повторяющиеся сообщения)
    
    Args:
        text: Текущее сообщение
        previous_messages: Последние сообщения пользователя
        
    Returns:
        ModerationResult если флуд, None если чисто
    """
    if not previous_messages:
        return None
    
    # Нормализация текста
    normalized = text.lower().strip()
    similar_count = sum(
        1 for msg in previous_messages 
        if msg.lower().strip() == normalized
    )
    
    if similar_count >= FLOOD_THRESHOLD:
        return ModerationResult(
            action="warn",
            reason=f"Flood detected: {similar_count} identical messages",
            confidence=0.9
        )
    return None


def check_profanity(text: str) -> Optional[ModerationResult]:
    """
    Простая проверка на нецензурную лексику
    
    Returns:
        ModerationResult если мат, None если чисто
    """
    # Базовый список (расширьте при необходимости)
    profanity_words = [
        r'\b(еб[а-яё]|нах[а-яё]|пизд[а-яё]|ху[йя]|бл[яя])\b',
        r'\b(сука|тварь|ублюдок|мраз[оь])\b',
    ]
    
    for pattern in profanity_words:
        if re.search(pattern, text, re.IGNORECASE):
            return ModerationResult(
                action="delete",
                reason="Profanity detected",
                confidence=0.85
            )
    return None


async def ai_moderate(
    text: str,
    ai_client: OpenRouterClient,
    system_prompt: str
) -> ModerationResult:
    """
    AI-модерация через OpenRouter
    
    Args:
        text: Текст для проверки
        ai_client: Клиент OpenRouter
        system_prompt: Системный промпт для модерации
        
    Returns:
        ModerationResult от AI
    """
    user_message = f"[ACTION: MODERATE]\n{text}"
    
    result = await ai_client.complete_json(
        system=system_prompt,
        user=user_message,
        mode="reason"
    )
    
    return ModerationResult(
        action=result.get("action", "allow"),
        reason=result.get("reason", "Unknown"),
        confidence=float(result.get("confidence", 0.5))
    )


async def moderate(
    text: str,
    ai_client: Optional[OpenRouterClient] = None,
    system_prompt: Optional[str] = None,
    previous_messages: Optional[list[str]] = None,
    use_ai: bool = True
) -> ModerationResult:
    """
    Полная проверка сообщения (быстрые правила + AI)
    
    Args:
        text: Текст сообщения
        ai_client: OpenRouter клиент для AI-модерации
        system_prompt: Промпт для AI-модерации
        previous_messages: Предыдущие сообщения для проверки на флуд
        use_ai: Использовать ли AI-модерацию
        
    Returns:
        ModerationResult
    """
    # 1. Проверка на спам
    result = check_spam_patterns(text)
    if result:
        logger.info(f"Модерация (спам): {result.action} - {result.reason}")
        return result
    
    # 2. Проверка на мат
    result = check_profanity(text)
    if result:
        logger.info(f"Модерация (мат): {result.action} - {result.reason}")
        return result
    
    # 3. Проверка на флуд
    if previous_messages:
        result = check_flood(text, previous_messages)
        if result:
            logger.info(f"Модерация (флуд): {result.action} - {result.reason}")
            return result
    
    # 4. AI-модерация для сложных случаев
    if use_ai and ai_client and system_prompt:
        try:
            result = await ai_moderate(text, ai_client, system_prompt)
            logger.info(f"AI модерация: {result.action} - {result.reason} (conf: {result.confidence})")
            return result
        except Exception as e:
            logger.error(f"Ошибка AI-модерации: {e}")
            # При ошибке AI — разрешаем сообщение
    
    # По умолчанию — разрешаем
    return ModerationResult(
        action="allow",
        reason="No violations detected",
        confidence=1.0
    )


# Промпт для AI-модерации
MODERATION_PROMPT = """
# РОЛЬ
Ты — модератор Telegram-чата. Твоя задача — анализировать сообщения и определять, 
нарушают ли они правила сообщества.

# ПРАВИЛА
Сообщения нужно УДАЛЯТЬ (delete), если они содержат:
- Спам, рекламу без разрешения
- Ссылки на конкурентов, сторонние каналы
- Оскорбления, угрозы, мат
- NSFW контент (18+, порнография)
- Персональные данные (телефоны, адреса, email)
- Призывы к насилию, экстремизму

Сообщения нужно ПРЕДУПРЕЖДАТЬ (warn), если они:
- Офтоп (не по теме канала)
- Слабый негатив, пассивная агрессия
- Повторные сообщения (не спам)

Пользователей нужно БАНИТЬ (ban), если они:
- Систематически нарушают правила
- Угрожают расправой
- Боты-спамеры

# ФОРМАТ ОТВЕТА
Верни ТОЛЬКО валидный JSON:
{"action": "allow|warn|delete|ban", "reason": "краткая причина", "confidence": 0.0-1.0}

Никаких пояснений, только JSON.
"""
