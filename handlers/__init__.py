"""
Handlers модуль
"""
from .admin import router as admin_router
from .user import router as user_router
from .moderation import router as moderation_router

__all__ = ["admin_router", "user_router", "moderation_router"]
