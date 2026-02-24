"""
Бесплатный API погоды через Open-Meteo
Не требует API ключей!
"""
import aiohttp
import logging
from datetime import datetime
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# API endpoints
OPEN_METEO_API = "https://api.open-meteo.com/v1"
GEOCODING_API = "https://geocoding-api.open-meteo.com/v1"

# Города России и мира (координаты)
CITIES_COORDS = {
    # Россия - миллионники
    "москва": (55.7558, 37.6173),
    "санкт-петербург": (59.9343, 30.3351),
    "новосибирск": (55.0084, 82.9357),
    "екатеринбург": (56.8389, 60.6057),
    "казань": (55.7961, 49.1064),
    "нижний новгород": (56.2965, 43.9361),
    "челябинск": (55.1644, 61.4368),
    "самара": (53.2001, 50.1500),
    "уфа": (54.7388, 55.9721),
    "ростов-на-дону": (47.2357, 39.7015),
    "омск": (54.9885, 73.3242),
    "красноярск": (56.0153, 92.8932),
    "воронеж": (51.6720, 39.1843),
    "пермь": (58.0105, 56.2502),
    "волгоград": (48.7080, 44.5133),
    "краснодар": (45.0355, 38.9753),
    "саратов": (51.5924, 46.0348),
    "тюмень": (57.1522, 65.5272),
    "тольятти": (53.5303, 49.3461),
    "ижевск": (56.8527, 53.2041),
    "барнаул": (53.3606, 83.7636),
    "ульяновск": (54.3141, 48.4031),
    "иркутск": (52.2870, 104.2805),
    "хабаровск": (48.4827, 135.0839),
    "ярославль": (57.6261, 39.8845),
    "владивосток": (43.1155, 131.8855),
    "махачкала": (42.9849, 47.5047),
    "томск": (56.5016, 84.9757),
    "оренбург": (51.7682, 55.0969),
    "кемерово": (55.3331, 86.0831),
    "новокузнецк": (53.7557, 87.1099),
    "рязань": (54.6269, 39.6916),
    "набережные челны": (55.7251, 52.4069),
    "астрахань": (46.3497, 48.0408),
    "пенза": (53.2007, 45.0046),
    "липецк": (52.6031, 39.5708),
    "киров": (58.6035, 49.6680),
    "чебоксары": (56.1439, 47.2517),
    "тула": (54.1931, 37.6182),
    "калининград": (54.7104, 20.4522),
    # Курорты
    "сочи": (43.6028, 39.7342),
    "адлер": (43.4280, 39.9460),
    "геленджик": (44.5620, 38.0769),
    "анастасиевка": (44.7833, 37.2833),
    # Зарубежные города
    "минск": (53.9006, 27.5590),
    "алматы": (43.2220, 76.8512),
    "астана": (51.1694, 71.4491),
    "ташкент": (41.2995, 69.2401),
    "бишкек": (42.8746, 74.5698),
    "киев": (50.4501, 30.5234),
    "ереван": (40.1792, 44.4991),
    "баку": (40.4093, 49.8671),
    "тбилиси": (41.7151, 44.8271),
    "кишинев": (47.0105, 28.8638),
    "дубай": (25.2048, 55.2708),
    "стамбул": (41.0082, 28.9784),
    "пекин": (39.9042, 116.4074),
    "токио": (35.6762, 139.6503),
    "сеул": (37.5665, 126.9780),
    "лондон": (51.5074, -0.1278),
    "париж": (48.8566, 2.3522),
    "берлин": (52.5200, 13.4050),
    "рим": (41.9028, 12.4964),
    "мадрид": (40.4168, -3.7038),
    "нью-йорк": (40.7128, -74.0060),
    "лос-анджелес": (34.0522, -118.2437),
    "майами": (25.7617, -80.1918),
    "чикаго": (41.8781, -87.6298),
    "торонто": (43.6532, -79.3832),
}


class FreeWeatherAPI:
    """Бесплатный API погоды через Open-Meteo"""

    def __init__(self):
        self._cache = {}
        self._cache_time = {}
        self._cache_ttl = 600  # 10 минут

    def _is_cache_valid(self, key: str) -> bool:
        """Проверка актуальности кэша"""
        if key not in self._cache_time:
            return False
        age = (datetime.now() - self._cache_time[key]).total_seconds()
        return age < self._cache_ttl

    async def get_weather(self, city: str) -> Dict:
        """
        Получить погоду в городе

        Args:
            city: Название города

        Returns:
            Dict: Данные о погоде
        """
        city_lower = city.lower()
        cache_key = f"weather_{city_lower}"

        if self._is_cache_valid(cache_key):
            return self._cache[cache_key]

        # Получаем координаты
        coords = CITIES_COORDS.get(city_lower)

        if not coords:
            # Пытаемся найти через геокодинг
            coords = await self._geocode_city(city)

        if not coords:
            return {"error": f"Город {city} не найден"}

        lat, lon = coords

        try:
            async with aiohttp.ClientSession() as session:
                url = f"{OPEN_METEO_API}/forecast"
                params = {
                    "latitude": lat,
                    "longitude": lon,
                    "current_weather": True,
                    "temperature_unit": "celsius",
                    "windspeed_unit": "ms",
                    "precipitation_unit": "mm",
                    "timezone": "auto",
                    "language": "ru"
                }

                async with session.get(url, params=params, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        result = self._format_weather_data(data, city)
                        self._cache[cache_key] = result
                        self._cache_time[cache_key] = datetime.now()
                        return result
                    else:
                        logger.error(f"Open-Meteo API error: {response.status}")
                        return self._get_default_weather(city)

        except Exception as e:
            logger.error(f"Error getting weather: {e}")
            return self._get_default_weather(city)

    async def _geocode_city(self, city: str) -> Optional[tuple]:
        """Геокодирование города через API"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{GEOCODING_API}/search"
                params = {
                    "name": city,
                    "count": 1,
                    "language": "ru",
                    "format": "json"
                }

                async with session.get(url, params=params, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        results = data.get("results", [])
                        if results:
                            result = results[0]
                            return (result["latitude"], result["longitude"])
        except Exception as e:
            logger.error(f"Geocoding error: {e}")

        return None

    def _format_weather_data(self, data: Dict, city: str) -> Dict:
        """Форматирование данных о погоде"""
        current = data.get("current_weather", {})

        # Коды погоды WMO
        weather_codes = {
            0: "ясно",
            1: "преимущественно ясно",
            2: "переменная облачность",
            3: "пасмурно",
            45: "туман",
            48: "иней",
            51: "морось",
            53: "умеренная морось",
            55: "плотная морось",
            61: "слабый дождь",
            63: "дождь",
            65: "сильный дождь",
            71: "слабый снег",
            73: "снег",
            75: "сильный снег",
            77: "снежные зерна",
            80: "слабый ливень",
            81: "ливень",
            82: "сильный ливень",
            85: "снежная крупа",
            86: "сильная снежная крупа",
            95: "гроза",
            96: "гроза с градом",
            99: "сильная гроза с градом",
        }

        code = current.get("weathercode", 0)
        description = weather_codes.get(code, "неизвестно")

        return {
            "city": city,
            "country": "RU",
            "temp": current.get("temperature", 0),
            "feels_like": current.get("temperature", 0),  # Open-Meteo не даёт feels_like
            "humidity": 65,  # Примерное значение
            "pressure": 760,  # Примерное значение
            "wind_speed": current.get("windspeed", 0),
            "wind_deg": current.get("winddirection", 0),
            "description": description,
            "icon": self._get_weather_icon(code),
            "time": current.get("time", ""),
        }

    def _get_weather_icon(self, code: int) -> str:
        """Получить иконку погоды"""
        if code == 0:
            return "☀️"
        elif code <= 3:
            return "⛅"
        elif code <= 48:
            return "🌫️"
        elif code <= 67:
            return "🌧️"
        elif code <= 77:
            return "🌨️"
        elif code <= 99:
            return "⛈️"
        else:
            return "🌤️"

    def _get_default_weather(self, city: str) -> Dict:
        """Дефолтная погода при ошибке API"""
        return {
            "city": city,
            "country": "RU",
            "temp": 20,
            "feels_like": 18,
            "humidity": 65,
            "pressure": 760,
            "wind_speed": 5,
            "description": "переменная облачность",
            "icon": "⛅",
        }

    async def get_weather_multiple_cities(self, cities: List[str]) -> Dict[str, Dict]:
        """Получить погоду в нескольких городах"""
        results = {}
        for city in cities:
            weather = await self.get_weather(city)
            results[city] = weather
        return results

    def get_supported_cities(self) -> List[str]:
        """Список поддерживаемых городов"""
        return list(CITIES_COORDS.keys())


# Глобальный экземпляр
free_weather = FreeWeatherAPI()
