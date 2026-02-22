"""
RAG Retriever - поиск релевантной информации в базе знаний
"""
import logging
import hashlib
from typing import Optional
from config import config
from .embedder import get_embedder, Embedder
from .vectorstore import VectorStore

logger = logging.getLogger(__name__)


class RAGRetriever:
    """RAG-ретривер для поиска по базе знаний"""
    
    def __init__(self, db_path: str):
        """
        Инициализировать RAG-ретривер
        
        Args:
            db_path: Путь к базе данных ChromaDB
        """
        self.embedder = get_embedder()
        self.vectorstore = VectorStore(db_path)
        self.chunk_size = config.RAG_CHUNK_SIZE
        self.chunk_overlap = config.RAG_CHUNK_OVERLAP
        self.top_k = config.RAG_TOP_K
        logger.info("RAG Retriever инициализирован")
    
    def _chunk_text(self, text: str) -> list[str]:
        """
        Разбить текст на чанки с перекрытием
        
        Args:
            text: Исходный текст
            
        Returns:
            Список чанков
        """
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + self.chunk_size
            chunk = text[start:end]
            
            # Если это не последний чанк, ищем ближайший пробел или предложение
            if end < text_length:
                # Пытаемся найти пробел в пределах чанка
                last_space = chunk.rfind(' ')
                if last_space > self.chunk_size // 2:
                    chunk = chunk[:last_space]
                    end = start + last_space
            
            chunks.append(chunk.strip())
            start = end - self.chunk_overlap
        
        return chunks
    
    def _generate_id(self, text: str, index: int) -> str:
        """Сгенерировать уникальный ID для чанка"""
        hash_obj = hashlib.md5(text.encode())
        return f"chunk_{hash_obj.hexdigest()[:12]}_{index}"
    
    def add_document(self, text: str, source: str = "unknown", metadata: Optional[dict] = None) -> int:
        """
        Добавить документ в базу знаний
        
        Args:
            text: Текст документа
            source: Источник документа (имя файла, URL и т.д.)
            metadata: Дополнительные метаданные
            
        Returns:
            Количество добавленных чанков
        """
        chunks = self._chunk_text(text)
        logger.info(f"Разбиение документа на {len(chunks)} чанков")
        
        ids = []
        metadatas = []
        
        for i, chunk in enumerate(chunks):
            chunk_id = self._generate_id(chunk, i)
            ids.append(chunk_id)
            
            chunk_metadata = {
                "source": source,
                "chunk_index": i,
                "total_chunks": len(chunks)
            }
            if metadata:
                chunk_metadata.update(metadata)
            metadatas.append(chunk_metadata)
        
        self.vectorstore.add_documents(
            texts=chunks,
            ids=ids,
            metadatas=metadatas
        )
        
        return len(chunks)
    
    def retrieve(self, query: str, top_k: Optional[int] = None) -> str:
        """
        Найти релевантные документы по запросу
        
        Args:
            query: Поисковый запрос
            top_k: Количество результатов (по умолчанию self.top_k)
            
        Returns:
            Конкатенированные релевантные документы
        """
        if top_k is None:
            top_k = self.top_k
        
        # Векторизация запроса
        query_embedding = self.embedder.encode_single(query)
        
        # Поиск
        results = self.vectorstore.search(
            query_embedding=query_embedding,
            top_k=top_k
        )
        
        # Извлечение документов
        documents = results.get("documents", [[]])[0]
        distances = results.get("distances", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        
        if not documents:
            logger.info(f"По запросу '{query}' ничего не найдено")
            return ""
        
        # Формирование результата с источниками
        formatted_docs = []
        for i, (doc, dist, meta) in enumerate(zip(documents, distances, metadatas)):
            source = meta.get("source", "unknown") if meta else "unknown"
            formatted_docs.append(f"[Источник: {source}]\n{doc}")
            logger.debug(f"Документ {i+1}: расстояние={dist:.4f}, источник={source}")
        
        result = "\n\n---\n\n".join(formatted_docs)
        logger.info(f"Найдено {len(documents)} релевантных документов")
        
        return result
    
    def get_stats(self) -> dict:
        """Получить статистику базы знаний"""
        return {
            "total_documents": self.vectorstore.get_document_count()
        }
    
    def clear(self):
        """Очистить базу знаний"""
        self.vectorstore.clear()
        logger.info("База знаний очищена")
