"""
Конфигурация бота
"""
import os
from dotenv import load_dotenv
from typing import List

load_dotenv()

class Config:
    # Telegram
    BOT_TOKEN: str = os.getenv("BOT_TOKEN", "")

    # OpenRouter
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")

    # Yandex SpeechKit (Алиса)
    YANDEX_API_KEY: str = os.getenv("YANDEX_API_KEY", "")
    YANDEX_FOLDER_ID: str = os.getenv("YANDEX_FOLDER_ID", "")

    # External APIs (опционально)
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")  # Опционально, есть дефолтная погода
    MOEX_API_URL: str = "https://iss.moex.com/iss"
    COINGECKO_API_URL: str = "https://api.coingecko.com/api/v3"

    # Telegram IDs
    CHANNEL_ID: str = os.getenv("CHANNEL_ID", "")
    GROUP_ID: str = os.getenv("GROUP_ID", "")
    ADMIN_IDS: List[int] = [int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x]

    # Database paths
    CHROMA_DB_PATH: str = os.getenv("CHROMA_DB_PATH", "./chroma_db")
    SQLITE_PATH: str = os.getenv("SQLITE_PATH", "./bot.db")

    # Bot settings
    BOT_NAME: str = os.getenv("BOT_NAME", "Aiden")
    BOT_TOPIC: str = os.getenv("BOT_TOPIC", "Технологии и AI")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # Rate limiting
    RATE_LIMIT_PER_USER: int = int(os.getenv("RATE_LIMIT_PER_USER", "5"))
    RATE_LIMIT_GLOBAL: int = int(os.getenv("RATE_LIMIT_GLOBAL", "60"))

    # RAG settings
    RAG_CHUNK_SIZE: int = 512
    RAG_CHUNK_OVERLAP: int = 64
    RAG_TOP_K: int = 3

    # Model routing
    MODELS = {
        "heavy": "qwen/qwen3-235b-a22b:free",
        "reason": "deepseek/deepseek-r1:free",
        "fast": "mistralai/mistral-7b-instruct:free",
        "backup": "google/gemma-3-27b-it:free",
    }

    # Posting schedule (MSK timezone)
    POST_SCHEDULE = [
        {"hour": 9, "minute": 0, "topic": "утренний совет"},
        {"hour": 14, "minute": 0, "topic": "дневной контент"},
        {"hour": 19, "minute": 30, "topic": "вечерний разбор"},
    ]

    # Knowledge categories
    KNOWLEDGE_CATEGORIES = [
        "Школа",
        "Вуз",
        "Сад",
        "AI",
        "Premium",
        "Инвест",
        "Крипта",
        "Бизнес",
        "Погода",
        "Инфляция",
    ]

    # Self-learning settings
    AUTO_LEARN_ENABLED: bool = os.getenv("AUTO_LEARN_ENABLED", "true").lower() == "true"
    AUTO_LEARN_THRESHOLD: float = float(os.getenv("AUTO_LEARN_THRESHOLD", "0.85"))

    # Subscription settings
    DEMO_PERIOD_DAYS: int = int(os.getenv("DEMO_PERIOD_DAYS", "7"))
    PREMIUM_STARS: int = int(os.getenv("PREMIUM_STARS", "990"))

    # Security
    SECURITY_ENABLED: bool = os.getenv("SECURITY_ENABLED", "true").lower() == "true"

    # Multi-language
    DEFAULT_LANGUAGE: str = os.getenv("DEFAULT_LANGUAGE", "ru")
    SUPPORTED_LANGUAGES: List[str] = [
        "ru", "en", "bg", "uk", "be", "kk", "uz", "az", "tr", "ar", "he", "fa",
        "zh", "ja", "ko", "hi", "es", "fr", "de", "it", "pt", "pl"
    ]

    @classmethod
    def validate(cls) -> bool:
        """Проверка обязательных настроек"""
        if not cls.BOT_TOKEN:
            raise ValueError("BOT_TOKEN не указан в .env")
        if not cls.OPENROUTER_API_KEY:
            raise ValueError("OPENROUTER_API_KEY не указан в .env")
        return True


config = Config()
