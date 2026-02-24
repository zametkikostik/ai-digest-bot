"""
Система подписок Telegram Stars
Демо доступ (7 дней), платные подписки, управление доступом
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
from database import crud

logger = logging.getLogger(__name__)


class SubscriptionTier(Enum):
    """Уровни подписки"""
    FREE = "free"
    DEMO = "demo"
    BASIC = "basic"
    PREMIUM = "premium"
    VIP = "vip"


@dataclass
class Subscription:
    """Подписка пользователя"""
    user_id: int
    tier: SubscriptionTier
    start_date: datetime
    end_date: Optional[datetime]
    stars_paid: int
    is_active: bool
    features: List[str]
    auto_renew: bool


class SubscriptionManager:
    """Менеджер подписок Telegram Stars"""

    def __init__(self):
        self._subscriptions: Dict[int, Subscription] = {}
        self._demo_users: Dict[int, datetime] = {}  # user_id -> start_date
        
        # Демо период
        self._demo_period_days = 7
        
        # Тарифы
        self._pricing = {
            SubscriptionTier.BASIC: {
                "stars": 299,
                "duration_days": 30,
                "features": [
                    "ai_tutor_basic",
                    "ai_lawyer_basic",
                    "ai_seo_basic",
                    "priority_support"
                ]
            },
            SubscriptionTier.PREMIUM: {
                "stars": 990,
                "duration_days": 30,
                "features": [
                    "ai_tutor_full",
                    "ai_lawyer_full",
                    "ai_seo_full",
                    "ai_journalist",
                    "ai_expert",
                    "voice_messages",
                    "priority_support",
                    "unlimited_requests"
                ]
            },
            SubscriptionTier.VIP: {
                "stars": 2990,
                "duration_days": 90,
                "features": [
                    "all_features",
                    "personal_manager",
                    "custom_integrations",
                    "api_access",
                    "white_label"
                ]
            }
        }

    async def activate_demo(self, user_id: int) -> Tuple[bool, str]:
        """
        Активация демо доступа (7 дней)

        Returns:
            (success, message)
        """
        # Проверяем, не был ли уже активирован демо
        if user_id in self._demo_users:
            demo_start = self._demo_users[user_id]
            demo_end = demo_start + timedelta(days=self._demo_period_days)
            
            if datetime.now() < demo_end:
                days_left = (demo_end - datetime.now()).days
                return False, f"Демо уже активировано. Осталось дней: {days_left}"
            else:
                return False, "Демо период уже истёк"

        # Активируем демо
        self._demo_users[user_id] = datetime.now()
        
        # Создаём подписку
        subscription = Subscription(
            user_id=user_id,
            tier=SubscriptionTier.DEMO,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=self._demo_period_days),
            stars_paid=0,
            is_active=True,
            features=[
                "ai_tutor_limited",
                "ai_lawyer_basic",
                "5_requests_per_day"
            ],
            auto_renew=False
        )
        
        self._subscriptions[user_id] = subscription
        
        # Сохраняем в БД
        self._save_subscription(subscription)
        
        return True, f"✅ Демо доступ активирован на {self._demo_period_days} дней!"

    async def purchase_subscription(
        self,
        user_id: int,
        tier: SubscriptionTier,
        stars_paid: int
    ) -> Tuple[bool, str]:
        """
        Покупка подписки за Telegram Stars

        Returns:
            (success, message)
        """
        if tier not in self._pricing:
            return False, "Неверный тариф"

        pricing = self._pricing[tier]
        
        # Проверка оплаты
        if stars_paid < pricing["stars"]:
            return False, f"Недостаточно звёзд. Нужно: {pricing['stars']}, Внесено: {stars_paid}"

        # Создаём подписку
        subscription = Subscription(
            user_id=user_id,
            tier=tier,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=pricing["duration_days"]),
            stars_paid=stars_paid,
            is_active=True,
            features=pricing["features"],
            auto_renew=False  # Telegram Stars не поддерживает авто-продление
        )

        # Если был демо — удаляем
        if user_id in self._demo_users:
            del self._demo_users[user_id]

        self._subscriptions[user_id] = subscription
        self._save_subscription(subscription)

        logger.info(f"💎 Подписка {tier.value} куплена пользователем {user_id} за {stars_paid} звёзд")

        return True, f"✅ Подписка {tier.value.upper()} активирована на {pricing['duration_days']} дней!"

    def check_access(
        self,
        user_id: int,
        feature: str
    ) -> Tuple[bool, str]:
        """
        Проверка доступа к функции

        Returns:
            (has_access, message)
        """
        # Проверяем подписку
        subscription = self._subscriptions.get(user_id)

        if not subscription:
            # Проверяем демо
            if user_id in self._demo_users:
                demo_start = self._demo_users[user_id]
                demo_end = demo_start + timedelta(days=self._demo_period_days)
                
                if datetime.now() < demo_end:
                    # Проверяем доступность функции в демо
                    demo_features = ["ai_tutor_limited", "ai_lawyer_basic"]
                    if feature in demo_features:
                        return True, "Демо доступ"
                    else:
                        return False, "Функция недоступна в демо. Оформите подписку."
                else:
                    return False, "Демо период истёк"
            else:
                return False, "Нет активной подписки"

        # Проверяем активность подписки
        if not subscription.is_active:
            return False, "Подписка неактивна"

        # Проверяем срок действия
        if subscription.end_date and datetime.now() > subscription.end_date:
            subscription.is_active = False
            self._save_subscription(subscription)
            return False, "Срок подписки истёк"

        # Проверяем доступ к функции
        if "all_features" in subscription.features:
            return True, "VIP доступ"

        if feature in subscription.features:
            return True, "Доступ разрешён"

        return False, f"Функция недоступна на тарифе {subscription.tier.value}"

    def get_subscription_info(self, user_id: int) -> Optional[Dict]:
        """Информация о подписке пользователя"""
        subscription = self._subscriptions.get(user_id)

        if not subscription:
            # Проверяем демо
            if user_id in self._demo_users:
                demo_start = self._demo_users[user_id]
                demo_end = demo_start + timedelta(days=self._demo_period_days)
                days_left = max(0, (demo_end - datetime.now()).days)
                
                return {
                    "tier": "demo",
                    "is_active": True,
                    "days_left": days_left,
                    "features": ["ai_tutor_limited", "ai_lawyer_basic", "5_requests_per_day"]
                }
            return None

        days_left = 0
        if subscription.end_date:
            days_left = max(0, (subscription.end_date - datetime.now()).days)

        return {
            "tier": subscription.tier.value,
            "is_active": subscription.is_active,
            "days_left": days_left,
            "features": subscription.features,
            "stars_paid": subscription.stars_paid,
            "start_date": subscription.start_date.strftime("%Y-%m-%d"),
            "end_date": subscription.end_date.strftime("%Y-%m-%d") if subscription.end_date else None
        }

    def get_pricing(self) -> Dict:
        """Информация о тарифах"""
        return {
            tier.value: {
                "stars": info["stars"],
                "duration_days": info["duration_days"],
                "features": info["features"]
            }
            for tier, info in self._pricing.items()
        }

    async def send_payment_invoice(
        self,
        bot,
        chat_id: int,
        tier: SubscriptionTier
    ) -> bool:
        """
        Отправка инвойса для оплаты Telegram Stars

        Note: Telegram Stars используют новую систему платежей
        """
        if tier not in self._pricing:
            return False

        pricing = self._pricing[tier]

        try:
            # В реальном проекте — использование Telegram Stars API
            # Для примера — отправка сообщения с инструкцией
            
            message = (
                f"💎 **Оплата подписки {tier.value.upper()}**\n\n"
                f"💰 Стоимость: {pricing['stars']} звёзд\n"
                f"📅 Срок: {pricing['duration_days']} дней\n\n"
                f"Функции:\n" +
                "\n".join([f"• {f}" for f in pricing['features']]) +
                "\n\n"
                f"Для оплаты используйте кнопку ниже ⬇️"
            )

            # В реальном проекте здесь будет отправка инвойса
            # await bot.send_invoice(...)

            logger.info(f"📤 Инвойс отправлен пользователю {chat_id}")
            return True

        except Exception as e:
            logger.error(f"Ошибка отправки инвойса: {e}")
            return False

    def _save_subscription(self, subscription: Subscription):
        """Сохранение подписки в БД"""
        # В реальном проекте — сохранение в базу данных
        # crud.save_subscription(subscription)
        pass

    def _load_subscriptions(self):
        """Загрузка подписок из БД"""
        # crud.load_subscriptions()
        pass


# Глобальный экземпляр
subscription_manager: Optional[SubscriptionManager] = None


def init_subscription_manager():
    """Инициализация менеджера подписок"""
    global subscription_manager
    subscription_manager = SubscriptionManager()
    logger.info("✅ Менеджер подписок инициализирован")
    return subscription_manager


# Хелперы для проверки доступа
def has_access(user_id: int, feature: str) -> bool:
    """Проверка доступа (упрощённая)"""
    if subscription_manager:
        has_access_result, _ = subscription_manager.check_access(user_id, feature)
        return has_access_result
    return False


def is_premium(user_id: int) -> bool:
    """Проверка premium доступа"""
    return has_access(user_id, "premium_features")


def is_demo(user_id: int) -> bool:
    """Проверка демо доступа"""
    if subscription_manager:
        info = subscription_manager.get_subscription_info(user_id)
        return info and info.get("tier") == "demo"
    return False
