"""
Handlers модуль
"""
from .admin import router as admin_router
from .user import router as user_router
from .moderation import router as moderation_router
from .categories import router as categories_router
from .premium import router as premium_router

__all__ = [
    "admin_router", 
    "user_router", 
    "moderation_router", 
    "categories_router",
    "premium_router"
]
