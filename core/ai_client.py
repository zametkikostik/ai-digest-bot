"""
OpenRouter API клиент
"""
import httpx
import json
import logging
from typing import Literal, Optional
from config import config

logger = logging.getLogger(__name__)

MODELS = config.MODELS


class OpenRouterClient:
    """Клиент для работы с OpenRouter API"""
    
    BASE_URL = "https://openrouter.ai/api/v1/chat/completions"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://your-bot.com",
            "X-Title": "TelegramBot",
            "Content-Type": "application/json"
        }
        self._client: Optional[httpx.AsyncClient] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=60)
        return self._client
    
    async def complete(
        self,
        system: str,
        user: str,
        mode: Literal["heavy", "reason", "fast", "backup"] = "fast",
        max_tokens: int = 2048,
        temperature: float = 0.7
    ) -> str:
        """
        Отправить запрос к OpenRouter API
        
        Args:
            system: Системный промпт
            user: Пользовательский запрос
            mode: Режим выбора модели (heavy/reason/fast/backup)
            max_tokens: Максимальное количество токенов
            temperature: Температура генерации
            
        Returns:
            Ответ модели
        """
        model = MODELS.get(mode, MODELS["fast"])
        
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user}
            ],
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        
        client = await self._get_client()
        
        try:
            response = await client.post(
                self.BASE_URL,
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            if "choices" not in data or len(data["choices"]) == 0:
                logger.error(f"Пустой ответ от API: {data}")
                raise ValueError("Пустой ответ от OpenRouter API")
            
            content = data["choices"][0]["message"]["content"]
            logger.debug(f"Ответ от {model}: {content[:100]}...")
            return content
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP ошибка: {e.response.status_code} - {e.response.text}")
            # Попытка использовать backup модель
            if mode != "backup":
                logger.info("Попытка с backup моделью...")
                return await self.complete(system, user, mode="backup", max_tokens=max_tokens, temperature=temperature)
            raise
        except httpx.RequestError as e:
            logger.error(f"Ошибка запроса: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Ошибка парсинга JSON: {e}")
            raise
    
    async def complete_json(
        self,
        system: str,
        user: str,
        mode: Literal["heavy", "reason", "fast", "backup"] = "reason",
    ) -> dict:
        """
        Отправить запрос и получить JSON-ответ
        
        Returns:
            Распарсенный JSON ответ
        """
        # Добавляем инструкцию для JSON формата
        system_json = system + "\n\nВАЖНО: Верни ответ ТОЛЬКО в формате валидного JSON, без пояснений."
        
        response = await self.complete(
            system=system_json,
            user=user,
            mode=mode,
            temperature=0.3  # Более детерминированный ответ для JSON
        )
        
        # Очистка ответа от markdown-блоков
        response = response.strip()
        if response.startswith("```json"):
            response = response[7:]
        if response.endswith("```"):
            response = response[:-3]
        response = response.strip()
        
        try:
            return json.loads(response)
        except json.JSONDecodeError as e:
            logger.error(f"Не удалось распарсить JSON: {response[:200]}")
            logger.error(f"Ошибка: {e}")
            # Возвращаем дефолтный ответ для модерации
            return {"action": "warn", "reason": "Ошибка парсинга ответа AI", "confidence": 0.5}
    
    async def close(self):
        """Закрыть HTTP клиент"""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
