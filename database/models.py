"""
SQLAlchemy модели базы данных
"""
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, 
    DateTime, Boolean, Float, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from config import config

Base = declarative_base()


class User(Base):
    """Пользователь бота"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    telegram_id = Column(Integer, unique=True, nullable=False, index=True)
    username = Column(String(255))
    first_name = Column(String(255))
    last_name = Column(String(255))
    is_admin = Column(Boolean, default=False)
    is_moderator = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)
    warnings_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи
    violations = relationship("Violation", back_populates="user", lazy="dynamic")
    
    def __repr__(self):
        return f"<User {self.telegram_id}: {self.username}>"


class Violation(Base):
    """Нарушения пользователей (лог модерации)"""
    __tablename__ = "violations"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    telegram_id = Column(Integer, nullable=False, index=True)
    action = Column(String(50), nullable=False)  # warn, delete, ban
    reason = Column(Text)
    confidence = Column(Float)
    message_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Связи
    user = relationship("User", back_populates="violations")
    
    def __repr__(self):
        return f"<Violation {self.id} for user {self.telegram_id}>"


class Post(Base):
    """Очередь постов для канала"""
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True)
    topic = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(String(50), default="pending")  # pending, published, failed
    priority = Column(Integer, default=0)  #越高优先级越高
    scheduled_at = Column(DateTime, nullable=True)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    error_message = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<Post {self.id}: {self.topic[:50]}>"


class KnowledgeDocument(Base):
    """Документы базы знаний (RAG)"""
    __tablename__ = "knowledge_documents"
    
    id = Column(Integer, primary_key=True)
    filename = Column(String(500), nullable=False)
    file_type = Column(String(50))  # txt, pdf, md, docx
    chunks_count = Column(Integer, default=0)
    file_hash = Column(String(64), unique=True)
    uploaded_by = Column(Integer)  # telegram_id админа
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<KnowledgeDocument {self.filename}>"


class ConversationContext(Base):
    """Контекст разговоров (для хранения истории)"""
    __tablename__ = "conversation_contexts"
    
    id = Column(Integer, primary_key=True)
    user_telegram_id = Column(Integer, unique=True, nullable=False, index=True)
    messages = Column(Text)  # JSON-сериализованный список сообщений
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<ConversationContext for user {self.user_telegram_id}>"


class RateLimit(Base):
    """Rate limiting для запросов"""
    __tablename__ = "rate_limits"
    
    id = Column(Integer, primary_key=True)
    user_telegram_id = Column(Integer, nullable=False, index=True)
    request_count = Column(Integer, default=1)
    window_start = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint('user_telegram_id', 'window_start'),
    )
    
    def __repr__(self):
        return f"<RateLimit for user {self.user_telegram_id}>"


class BotLog(Base):
    """Логи бота"""
    __tablename__ = "bot_logs"
    
    id = Column(Integer, primary_key=True)
    level = Column(String(50), default="INFO")  # INFO, WARNING, ERROR
    message = Column(Text, nullable=False)
    source = Column(String(100))  # модуль-источник
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f"<BotLog {self.level}: {self.message[:50]}>"


# Инициализация базы данных
engine = create_engine(f"sqlite:///{config.SQLITE_PATH}", echo=False)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def init_db():
    """Создать все таблицы"""
    Base.metadata.create_all(bind=engine)


def get_session():
    """Получить сессию БД"""
    db = SessionLocal()
    try:
        return db
    except Exception:
        db.close()
        raise
