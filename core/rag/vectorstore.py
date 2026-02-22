"""
Векторное хранилище на базе ChromaDB
"""
import logging
import chromadb
from chromadb.config import Settings

logger = logging.getLogger(__name__)


class VectorStore:
    """ChromaDB векторное хранилище"""
    
    COLLECTION_NAME = "knowledge"
    
    def __init__(self, db_path: str):
        """
        Инициализировать ChromaDB
        
        Args:
            db_path: Путь к директории базы данных
        """
        logger.info(f"Инициализация ChromaDB: {db_path}")
        self.client = chromadb.PersistentClient(path=db_path)
        self.collection = self.client.get_or_create_collection(
            name=self.COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
        logger.info(f"Коллекция '{self.COLLECTION_NAME}' готова")
    
    def add_documents(
        self,
        texts: list[str],
        ids: list[str],
        metadatas: list[dict] | None = None
    ):
        """
        Добавить документы в хранилище
        
        Args:
            texts: Список текстов документов
            ids: Список уникальных идентификаторов
            metadatas: Список метаданных (опционально)
        """
        if len(texts) != len(ids):
            raise ValueError("Количество текстов и ID должно совпадать")
        
        logger.info(f"Добавление {len(texts)} документов в хранилище")
        self.collection.add(
            documents=texts,
            ids=ids,
            metadatas=metadatas
        )
        logger.info("Документы успешно добавлены")
    
    def search(
        self,
        query_embedding: list[float],
        top_k: int = 3,
        filter_metadata: dict | None = None
    ) -> dict:
        """
        Поиск релевантных документов
        
        Args:
            query_embedding: Вектор запроса
            top_k: Количество результатов
            filter_metadata: Фильтр по метаданным
            
        Returns:
            Результаты поиска
        """
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=filter_metadata
        )
        return results
    
    def get_document_count(self) -> int:
        """Получить количество документов в хранилище"""
        return self.collection.count()
    
    def delete_documents(self, ids: list[str]):
        """Удалить документы по ID"""
        self.collection.delete(ids=ids)
        logger.info(f"Удалено {len(ids)} документов")
    
    def clear(self):
        """Очистить всё хранилище"""
        self.client.delete_collection(self.COLLECTION_NAME)
        self.collection = self.client.get_or_create_collection(
            name=self.COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
        logger.info("Хранилище очищено")
