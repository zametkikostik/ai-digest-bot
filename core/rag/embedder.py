"""
Модуль векторизации текста (embeddings)
"""
import logging
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)


class Embedder:
    """Векторизация текста с помощью sentence-transformers"""
    
    MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
    
    def __init__(self):
        logger.info(f"Загрузка модели эмбеддингов: {self.MODEL_NAME}")
        self.model = SentenceTransformer(self.MODEL_NAME)
        logger.info("Модель эмбеддингов загружена")
    
    def encode(self, texts: list[str]) -> list[list[float]]:
        """
        Векторизовать тексты
        
        Args:
            texts: Список текстов для векторизации
            
        Returns:
            Список векторов (embeddings)
        """
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()
    
    def encode_single(self, text: str) -> list[float]:
        """
        Векторизовать один текст
        
        Args:
            text: Текст для векторизации
            
        Returns:
            Вектор (embedding)
        """
        embedding = self.model.encode([text], convert_to_numpy=True)
        return embedding[0].tolist()


# Глобальный экземпляр (ленивая инициализация)
_embedder: Embedder | None = None


def get_embedder() -> Embedder:
    """Получить или создать экземпляр Embedder"""
    global _embedder
    if _embedder is None:
        _embedder = Embedder()
    return _embedder
