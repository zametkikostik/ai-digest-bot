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
    
    @classmethod
    def validate(cls) -> bool:
        """Проверка обязательных настроек"""
        if not cls.BOT_TOKEN:
            raise ValueError("BOT_TOKEN не указан в .env")
        if not cls.OPENROUTER_API_KEY:
            raise ValueError("OPENROUTER_API_KEY не указан в .env")
        return True


config = Config()
