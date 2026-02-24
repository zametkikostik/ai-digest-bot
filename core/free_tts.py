"""
Бесплатный TTS (Text-to-Speech) через gTTS (Google Text-to-Speech)
Не требует API ключей!
"""
import io
import logging
from typing import Optional
from gtts import gTTS
import tempfile
import os

logger = logging.getLogger(__name__)


class FreeTTS:
    """Бесплатный TTS через gTTS"""

    def __init__(self):
        self.default_lang = "ru"
        self.default_tld = "ru"  # Регион (ru, com, co.uk и т.д.)
        self.default_slow = False

    async def text_to_speech(
        self,
        text: str,
        lang: str = "ru",
        slow: bool = False
    ) -> Optional[bytes]:
        """
        Преобразование текста в речь

        Args:
            text: Текст для озвучивания
            lang: Язык (ru, en, de, fr, es, it, pt, pl, uk, be, kk, uz, tr, ar, he, zh, ja, ko)
            slow: Медленная скорость

        Returns:
            bytes: MP3 данные или None при ошибке
        """
        try:
            # Определяем регион для русского
            if lang == "ru":
                tld = "ru"
            elif lang == "en":
                tld = "com"
            elif lang == "de":
                tld = "de"
            elif lang == "fr":
                tld = "fr"
            elif lang == "es":
                tld = "es"
            elif lang == "it":
                tld = "it"
            elif lang == "pt":
                tld = "pt"
            elif lang == "pl":
                tld = "pl"
            elif lang == "uk":
                tld = "com.ua"
            elif lang == "be":
                tld = "by"
            elif lang == "kk":
                tld = "kz"
            elif lang == "uz":
                tld = "uz"
            elif lang == "tr":
                tld = "com.tr"
            elif lang == "ar":
                tld = "ae"
            elif lang == "he":
                tld = "co.il"
            elif lang == "zh":
                tld = "cn"
            elif lang == "ja":
                tld = "co.jp"
            elif lang == "ko":
                tld = "co.kr"
            else:
                tld = "com"

            # Генерируем речь
            tts = gTTS(text=text, lang=lang, tld=tld, slow=slow)

            # Сохраняем в bytes
            audio_bytes = io.BytesIO()
            tts.write_to_fp(audio_bytes)
            audio_bytes.seek(0)

            logger.info(f"✅ TTS выполнен, размер: {len(audio_bytes.getvalue())} байт")
            return audio_bytes.getvalue()

        except Exception as e:
            logger.error(f"Ошибка TTS: {e}")
            return None

    def get_supported_languages(self) -> list:
        """Список поддерживаемых языков"""
        return [
            {"code": "ru", "name": "Русский", "flag": "🇷🇺"},
            {"code": "en", "name": "English", "flag": "🇬🇧"},
            {"code": "de", "name": "Deutsch", "flag": "🇩🇪"},
            {"code": "fr", "name": "Français", "flag": "🇫🇷"},
            {"code": "es", "name": "Español", "flag": "🇪🇸"},
            {"code": "it", "name": "Italiano", "flag": "🇮🇹"},
            {"code": "pt", "name": "Português", "flag": "🇵🇹"},
            {"code": "pl", "name": "Polski", "flag": "🇵🇱"},
            {"code": "uk", "name": "Українська", "flag": "🇺🇦"},
            {"code": "be", "name": "Беларуская", "flag": "🇧🇾"},
            {"code": "kk", "name": "Қазақша", "flag": "🇰🇿"},
            {"code": "uz", "name": "O'zbek", "flag": "🇺🇿"},
            {"code": "tr", "name": "Türkçe", "flag": "🇹🇷"},
            {"code": "ar", "name": "العربية", "flag": "🇸🇦"},
            {"code": "he", "name": "עברית", "flag": "🇮🇱"},
            {"code": "zh", "name": "中文", "flag": "🇨🇳"},
            {"code": "ja", "name": "日本語", "flag": "🇯🇵"},
            {"code": "ko", "name": "한국어", "flag": "🇰🇷"},
        ]


# Глобальный экземпляр
free_tts = FreeTTS()


async def send_voice_message(
    bot,
    chat_id: int,
    text: str,
    lang: str = "ru"
):
    """
    Отправить голосовое сообщение в Telegram

    Args:
        bot: Экземпляр бота
        chat_id: ID чата
        text: Текст для озвучивания
        lang: Язык
    """
    # Генерируем речь
    audio_data = await free_tts.text_to_speech(text, lang)

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
