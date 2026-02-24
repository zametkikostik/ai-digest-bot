"""
Модуль интеграции с Яндекс.Алисой (Yandex SpeechKit)
Преобразование текста в речь (TTS) и речи в текст (STT)
"""
import io
import logging
import aiohttp
from typing import Optional, Tuple
from datetime import datetime
from config import config

logger = logging.getLogger(__name__)

# Yandex SpeechKit API endpoints
YANDEX_TTS_URL = "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize"
YANDEX_STT_URL = "https://stt.api.cloud.yandex.net/speech/v1/stt:recognize"
YANDEX_IAM_URL = "https://iam.api.cloud.yandex.net/iam/v1/tokens"


class YandexAlice:
    """Класс для работы с Яндекс.Алисой через SpeechKit API"""

    def __init__(self, api_key: Optional[str] = None, folder_id: Optional[str] = None):
        """
        Инициализация клиента

        Args:
            api_key: Yandex Cloud API ключ
            folder_id: Yandex Cloud folder ID
        """
        self.api_key = api_key or config.YANDEX_API_KEY
        self.folder_id = folder_id or config.YANDEX_FOLDER_ID
        self._iam_token: Optional[str] = None
        self._iam_token_expiry: Optional[datetime] = None

        # Параметры TTS
        self.tts_voice = "alena"  # Голос Алисы
        self.tts_emotions = "neutral"  # Эмоция
        self.tts_speed = 1.0  # Скорость (0.5-3.0)
        self.tts_pitch = 0  # Тон (-1 до 1)
        self.tts_volume = 1.0  # Громкость (0-1)
        self.tts_format = "lpcm"  # Формат аудио
        self.tts_sample_rate = 22050  # Частота дискретизации

    async def _get_iam_token(self) -> str:
        """
        Получить IAM токен для авторизации

        Returns:
            str: IAM токен
        """
        # Проверяем кэш токена
        if self._iam_token and self._iam_token_expiry:
            if datetime.now() < self._iam_token_expiry:
                return self._iam_token

        # Запрашиваем новый токен
        try:
            async with aiohttp.ClientSession() as session:
                url = YANDEX_IAM_URL
                headers = {
                    "Authorization": f"Api-Key {self.api_key}",
                    "Content-Type": "application/json"
                }
                data = {"yandexPassportOauthToken": self.api_key}

                async with session.post(url, headers=headers, json=data, timeout=10) as response:
                    if response.status == 200:
                        result = await response.json()
                        self._iam_token = result.get('iamToken')
                        
                        # Токен действителен 1 час, кэшируем на 50 минут
                        self._iam_token_expiry = datetime.now() + timedelta(minutes=50)
                        
                        logger.info("✅ IAM токен получен")
                        return self._iam_token
                    else:
                        logger.error(f"Ошибка получения IAM токена: {response.status}")
                        return ""
        except Exception as e:
            logger.error(f"Ошибка получения IAM токена: {e}")
            return ""

    async def text_to_speech(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: Optional[float] = None,
        emotion: Optional[str] = None
    ) -> Optional[bytes]:
        """
        Преобразование текста в речь (TTS)

        Args:
            text: Текст для озвучивания
            voice: Голос (alena, filipp, erkanyavas и др.)
            speed: Скорость (0.5-3.0)
            emotion: Эмоция (neutral, good, evil)

        Returns:
            bytes: Аудиоданные в формате WAV/MP3 или None при ошибке
        """
        if not self.api_key or not self.folder_id:
            logger.warning("Yandex API ключ или folder ID не указаны")
            return None

        # Получаем IAM токен
        iam_token = await self._get_iam_token()
        if not iam_token:
            return None

        # Параметры
        voice = voice or self.tts_voice
        speed = str(speed or self.tts_speed)
        emotion = emotion or self.tts_emotions

        try:
            async with aiohttp.ClientSession() as session:
                url = YANDEX_TTS_URL
                headers = {
                    "Authorization": f"Bearer {iam_token}",
                    "X-Data-Authorization-Check": "true"
                }
                params = {
                    "text": text,
                    "lang": "ru-RU",
                    "voice": voice,
                    "speed": speed,
                    "emotion": emotion,
                    "folderId": self.folder_id,
                    "format": self.tts_format,
                    "sampleRateHertz": str(self.tts_sample_rate),
                }

                async with session.get(url, headers=headers, params=params, timeout=30) as response:
                    if response.status == 200:
                        audio_data = await response.read()
                        logger.info(f"✅ TTS выполнен, размер: {len(audio_data)} байт")
                        return audio_data
                    else:
                        error_text = await response.text()
                        logger.error(f"Ошибка TTS: {response.status} - {error_text}")
                        return None
        except Exception as e:
            logger.error(f"Ошибка TTS: {e}")
            return None

    async def text_to_speech_mp3(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: Optional[float] = None
    ) -> Optional[bytes]:
        """
        Преобразование текста в речь в формате MP3

        Args:
            text: Текст для озвучивания
            voice: Голос
            speed: Скорость

        Returns:
            bytes: Аудиоданные MP3
        """
        # Временно меняем формат
        original_format = self.tts_format
        self.tts_format = "mp3"

        audio_data = await self.text_to_speech(text, voice, speed)

        # Возвращаем формат
        self.tts_format = original_format

        return audio_data

    async def speech_to_text(
        self,
        audio_data: bytes,
        sample_rate: int = 22050,
        language: str = "ru-RU"
    ) -> Optional[str]:
        """
        Преобразование речи в текст (STT)

        Args:
            audio_data: Аудиоданные (LPCM/MP3/OGG)
            sample_rate: Частота дискретизации
            language: Язык распознавания

        Returns:
            str: Распознанный текст или None при ошибке
        """
        if not self.api_key or not self.folder_id:
            logger.warning("Yandex API ключ или folder ID не указаны")
            return None

        # Получаем IAM токен
        iam_token = await self._get_iam_token()
        if not iam_token:
            return None

        try:
            async with aiohttp.ClientSession() as session:
                url = YANDEX_STT_URL
                headers = {
                    "Authorization": f"Bearer {iam_token}",
                    "X-Data-Authorization-Check": "true",
                    "Content-Type": "audio/lpcm; rate=22050"
                }
                params = {
                    "sampleRateHertz": str(sample_rate),
                    "lang": language,
                    "rawData": "true"
                }

                async with session.post(
                    url,
                    headers=headers,
                    params=params,
                    data=audio_data,
                    timeout=60
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        text = result.get('result', '')
                        logger.info(f"✅ STT выполнен: {text[:50]}...")
                        return text
                    else:
                        error_text = await response.text()
                        logger.error(f"Ошибка STT: {response.status} - {error_text}")
                        return None
        except Exception as e:
            logger.error(f"Ошибка STT: {e}")
            return None

    async def speech_to_text_file(
        self,
        file_path: str,
        language: str = "ru-RU"
    ) -> Optional[str]:
        """
        Распознавание речи из файла

        Args:
            file_path: Путь к аудиофайлу
            language: Язык распознавания

        Returns:
            str: Распознанный текст
        """
        try:
            with open(file_path, 'rb') as f:
                audio_data = f.read()

            return await self.speech_to_text(audio_data, language=language)
        except Exception as e:
            logger.error(f"Ошибка чтения файла: {e}")
            return None

    def set_voice(self, voice: str):
        """Установить голос"""
        available_voices = [
            "alena", "filipp", "ermil", "jane", "oksana",
            "zahar", "ermil", "madhead", "lobanov", "glafira"
        ]
        if voice.lower() in available_voices:
            self.tts_voice = voice.lower()
            logger.info(f"Голос установлен: {voice}")
        else:
            logger.warning(f"Недоступный голос: {voice}. Доступны: {available_voices}")

    def set_speed(self, speed: float):
        """Установить скорость (0.5-3.0)"""
        if 0.5 <= speed <= 3.0:
            self.tts_speed = speed
            logger.info(f"Скорость установлена: {speed}")
        else:
            logger.warning("Скорость должна быть от 0.5 до 3.0")

    def set_emotion(self, emotion: str):
        """Установить эмоцию"""
        available_emotions = ["neutral", "good", "evil"]
        if emotion.lower() in available_emotions:
            self.tts_emotions = emotion.lower()
            logger.info(f"Эмоция установлена: {emotion}")
        else:
            logger.warning(f"Недоступная эмоция: {emotion}. Доступны: {available_emotions}")

    async def get_available_voices(self) -> list:
        """Получить список доступных голосов"""
        return [
            {"name": "alena", "gender": "female", "description": "Алиса (основной)"},
            {"name": "filipp", "gender": "male", "description": "Филипп"},
            {"name": "ermil", "gender": "male", "description": "Ермил"},
            {"name": "jane", "gender": "female", "description": "Джейн"},
            {"name": "oksana", "gender": "female", "description": "Оксана"},
            {"name": "zahar", "gender": "male", "description": "Захар"},
            {"name": "madhead", "gender": "male", "description": "Madhead (эмоциональный)"},
            {"name": "lobanov", "gender": "male", "description": "Лобанов"},
            {"name": "glafira", "gender": "female", "description": "Глафира"},
        ]


# Глобальный экземпляр
yandex_alice: Optional[YandexAlice] = None


def init_yandex_alice(api_key: Optional[str] = None, folder_id: Optional[str] = None):
    """
    Инициализация Яндекс.Алисы

    Args:
        api_key: Yandex Cloud API ключ
        folder_id: Yandex Cloud folder ID

    Returns:
        YandexAlice: Экземпляр клиента
    """
    global yandex_alice
    yandex_alice = YandexAlice(api_key, folder_id)
    logger.info("✅ Яндекс.Алиса инициализирована")
    return yandex_alice


async def send_voice_message(
    bot,
    chat_id: int,
    text: str,
    voice: str = "alena",
    speed: float = 1.0
):
    """
    Отправить голосовое сообщение в Telegram

    Args:
        bot: Экземпляр бота
        chat_id: ID чата
        text: Текст для озвучивания
        voice: Голос
        speed: Скорость
    """
    if not yandex_alice:
        logger.warning("Яндекс.Алиса не инициализирована")
        return

    # Генерируем речь
    audio_data = await yandex_alice.text_to_speech_mp3(text, voice, speed)

    if audio_data:
        # Отправляем как голосовое сообщение
        audio_file = io.BytesIO(audio_data)
        audio_file.name = "voice_message.mp3"

        await bot.send_voice(
            chat_id=chat_id,
            voice=audio_file,
            caption=text[:100] + "..." if len(text) > 100 else text
        )
        logger.info(f"✅ Голосовое сообщение отправлено в чат {chat_id}")
    else:
        logger.error("Не удалось сгенерировать речь")
