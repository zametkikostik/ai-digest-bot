"""
Простой HTTP-сервер для health checks на Render
"""
import asyncio
import logging
from aiohttp import web

logger = logging.getLogger(__name__)


class HealthServer:
    """HTTP-сервер только для health check endpoint"""

    def __init__(self, port: int = 8080):
        self.port = port
        self.app = web.Application()
        self.app.router.add_get('/health', self.health_handler)
        self.app.router.add_get('/', self.root_handler)
        self.runner = None

    async def health_handler(self, request: web.Request) -> web.Response:
        """Health check endpoint"""
        return web.json_response({"status": "healthy"})

    async def root_handler(self, request: web.Request) -> web.Response:
        """Root endpoint"""
        return web.json_response({
            "service": "Aiden Telegram Bot",
            "status": "running",
            "health": "/health"
        })

    async def start(self):
        """Запустить сервер"""
        self.runner = web.AppRunner(self.app)
        await self.runner.setup()
        site = web.TCPSite(self.runner, '0.0.0.0', self.port)
        await site.start()
        logger.info(f"Health server запущен на порту {self.port}")

    async def stop(self):
        """Остановить сервер"""
        if self.runner:
            await self.runner.cleanup()
            logger.info("Health server остановлен")
