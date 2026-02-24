"""
CRUD операции для базы данных
"""
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy import desc, func
from sqlalchemy.orm import Session
from database.models import (
    User, Violation, Post, KnowledgeDocument,
    ConversationContext, RateLimit, BotLog,
    Category, FAQQuestion, get_session
)

logger = logging.getLogger(__name__)


# ==================== USER ====================

def get_user(db: Session, telegram_id: int) -> Optional[User]:
    """Получить пользователя по Telegram ID"""
    return db.query(User).filter(User.telegram_id == telegram_id).first()


def create_user(
    db: Session,
    telegram_id: int,
    username: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None
) -> User:
    """Создать нового пользователя"""
    user = User(
        telegram_id=telegram_id,
        username=username,
        first_name=first_name,
        last_name=last_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"Создан пользователь: {telegram_id}")
    return user


def get_or_create_user(
    db: Session,
    telegram_id: int,
    username: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None
) -> User:
    """Получить или создать пользователя"""
    user = get_user(db, telegram_id)
    if not user:
        user = create_user(db, telegram_id, username, first_name, last_name)
    else:
        # Обновление данных
        if username and user.username != username:
            user.username = username
        if first_name and user.first_name != first_name:
            user.first_name = first_name
        if last_name and user.last_name != last_name:
            user.last_name = last_name
        db.commit()
        db.refresh(user)
    return user


def set_admin(db: Session, telegram_id: int, is_admin: bool = True) -> bool:
    """Назначить или снять права администратора"""
    user = get_user(db, telegram_id)
    if not user:
        return False
    user.is_admin = is_admin
    db.commit()
    logger.info(f"Пользователь {telegram_id}: is_admin={is_admin}")
    return True


def set_moderator(db: Session, telegram_id: int, is_moderator: bool = True) -> bool:
    """Назначить или снять права модератора"""
    user = get_user(db, telegram_id)
    if not user:
        return False
    user.is_moderator = is_moderator
    db.commit()
    logger.info(f"Пользователь {telegram_id}: is_moderator={is_moderator}")
    return True


def ban_user(db: Session, telegram_id: int) -> bool:
    """Забанить пользователя"""
    user = get_user(db, telegram_id)
    if not user:
        return False
    user.is_banned = True
    db.commit()
    logger.warning(f"Пользователь забанен: {telegram_id}")
    return True


def unban_user(db: Session, telegram_id: int) -> bool:
    """Разбанить пользователя"""
    user = get_user(db, telegram_id)
    if not user:
        return False
    user.is_banned = False
    db.commit()
    logger.info(f"Пользователь разбанен: {telegram_id}")
    return True


def add_warning(db: Session, telegram_id: int) -> int:
    """Добавить предупреждение пользователю"""
    user = get_user(db, telegram_id)
    if not user:
        return 0
    user.warnings_count += 1
    db.commit()
    logger.warning(f"Предупреждение пользователю {telegram_id}: count={user.warnings_count}")
    return user.warnings_count


def reset_warnings(db: Session, telegram_id: int) -> bool:
    """Сбросить предупреждения пользователя"""
    user = get_user(db, telegram_id)
    if not user:
        return False
    user.warnings_count = 0
    db.commit()
    return True


# ==================== VIOLATION ====================

def log_violation(
    db: Session,
    telegram_id: int,
    action: str,
    reason: str,
    confidence: float,
    message_text: str
) -> Violation:
    """Записать нарушение в лог"""
    violation = Violation(
        telegram_id=telegram_id,
        action=action,
        reason=reason,
        confidence=confidence,
        message_text=message_text[:2000]  # Ограничение длины
    )
    db.add(violation)
    
    # Связь с пользователем
    user = get_user(db, telegram_id)
    if user:
        violation.user = user
    
    db.commit()
    db.refresh(violation)
    return violation


def get_violations(db: Session, telegram_id: int, limit: int = 10) -> List[Violation]:
    """Получить нарушения пользователя"""
    return db.query(Violation).filter(
        Violation.telegram_id == telegram_id
    ).order_by(desc(Violation.created_at)).limit(limit).all()


# ==================== POST ====================

def create_post(
    db: Session,
    topic: str,
    content: str,
    priority: int = 0,
    scheduled_at: Optional[datetime] = None
) -> Post:
    """Создать пост в очереди"""
    post = Post(
        topic=topic,
        content=content,
        priority=priority,
        scheduled_at=scheduled_at
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    logger.info(f"Создан пост в очереди: {topic[:50]}")
    return post


def get_pending_posts(db: Session, limit: int = 10) -> List[Post]:
    """Получить ожидающие посты"""
    return db.query(Post).filter(
        Post.status == "pending"
    ).order_by(desc(Post.priority), Post.scheduled_at).limit(limit).all()


def set_post_published(db: Session, post_id: int) -> bool:
    """Отметить пост как опубликованный"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        return False
    post.status = "published"
    post.published_at = datetime.utcnow()
    db.commit()
    return True


def set_post_failed(db: Session, post_id: int, error: str) -> bool:
    """Отметить пост как неудачный"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        return False
    post.status = "failed"
    post.error_message = error
    db.commit()
    return True


# ==================== KNOWLEDGE DOCUMENT ====================

def add_knowledge_document(
    db: Session,
    filename: str,
    file_type: str,
    chunks_count: int,
    file_hash: str,
    uploaded_by: int
) -> KnowledgeDocument:
    """Добавить документ в базу знаний"""
    doc = KnowledgeDocument(
        filename=filename,
        file_type=file_type,
        chunks_count=chunks_count,
        file_hash=file_hash,
        uploaded_by=uploaded_by
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    logger.info(f"Добавлен документ в базу знаний: {filename}")
    return doc


def get_knowledge_documents(db: Session, limit: int = 50) -> List[KnowledgeDocument]:
    """Получить список документов"""
    return db.query(KnowledgeDocument).order_by(
        desc(KnowledgeDocument.uploaded_at)
    ).limit(limit).all()


def delete_knowledge_document(db: Session, doc_id: int) -> bool:
    """Удалить документ из базы знаний"""
    doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == doc_id).first()
    if not doc:
        return False
    db.delete(doc)
    db.commit()
    logger.info(f"Удален документ из базы знаний: {doc.filename}")
    return True


def get_knowledge_stats(db: Session) -> dict:
    """Получить статистику базы знаний"""
    total_docs = db.query(func.count(KnowledgeDocument.id)).scalar()
    total_chunks = db.query(func.sum(KnowledgeDocument.chunks_count)).scalar() or 0
    return {
        "total_documents": total_docs,
        "total_chunks": total_chunks
    }


# ==================== CONVERSATION CONTEXT ====================

def get_conversation_context(db: Session, telegram_id: int) -> Optional[List[dict]]:
    """Получить контекст разговора"""
    ctx = db.query(ConversationContext).filter(
        ConversationContext.user_telegram_id == telegram_id
    ).first()
    if not ctx:
        return None
    return json.loads(ctx.messages)


def save_conversation_context(
    db: Session,
    telegram_id: int,
    messages: List[dict],
    max_messages: int = 10
) -> ConversationContext:
    """Сохранить контекст разговора"""
    # Ограничиваем количество сообщений
    messages = messages[-max_messages:]
    
    ctx = db.query(ConversationContext).filter(
        ConversationContext.user_telegram_id == telegram_id
    ).first()
    
    if not ctx:
        ctx = ConversationContext(
            user_telegram_id=telegram_id,
            messages=json.dumps(messages, ensure_ascii=False)
        )
        db.add(ctx)
    else:
        ctx.messages = json.dumps(messages, ensure_ascii=False)
        ctx.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(ctx)
    return ctx


def clear_conversation_context(db: Session, telegram_id: int) -> bool:
    """Очистить контекст разговора"""
    ctx = db.query(ConversationContext).filter(
        ConversationContext.user_telegram_id == telegram_id
    ).first()
    if not ctx:
        return False
    db.delete(ctx)
    db.commit()
    return True


# ==================== RATE LIMIT ====================

def check_rate_limit(
    db: Session,
    telegram_id: int,
    max_requests: int = 5,
    window_minutes: int = 1
) -> bool:
    """
    Проверить rate limit для пользователя
    
    Returns:
        True если запрос разрешен, False если превышен лимит
    """
    now = datetime.utcnow()
    window_start = now - timedelta(minutes=window_minutes)
    
    # Находим запись в текущем окне
    rate_limit = db.query(RateLimit).filter(
        RateLimit.user_telegram_id == telegram_id,
        RateLimit.window_start >= window_start
    ).first()
    
    if not rate_limit:
        # Создаем новую запись
        db.add(RateLimit(
            user_telegram_id=telegram_id,
            request_count=1,
            window_start=now
        ))
        db.commit()
        return True
    
    if rate_limit.request_count >= max_requests:
        return False
    
    rate_limit.request_count += 1
    db.commit()
    return True


# ==================== BOT LOG ====================

def log_bot_message(
    db: Session,
    level: str,
    message: str,
    source: Optional[str] = None
) -> BotLog:
    """Записать сообщение в лог бота"""
    log = BotLog(
        level=level,
        message=message,
        source=source
    )
    db.add(log)
    db.commit()
    return log


def get_bot_logs(db: Session, limit: int = 100, level: Optional[str] = None) -> List[BotLog]:
    """Получить логи бота"""
    query = db.query(BotLog)
    if level:
        query = query.filter(BotLog.level == level)
    return query.order_by(desc(BotLog.created_at)).limit(limit).all()


# ==================== STATS ====================

def get_stats(db: Session) -> dict:
    """Получить общую статистику"""
    return {
        "total_users": db.query(func.count(User.id)).scalar(),
        "total_violations": db.query(func.count(Violation.id)).scalar(),
        "pending_posts": db.query(func.count(Post.id)).filter(Post.status == "pending").scalar(),
        "knowledge_documents": db.query(func.count(KnowledgeDocument.id)).scalar()
    }


# ==================== CATEGORY ====================

def create_category(
    db: Session,
    name: str,
    description: Optional[str] = None,
    emoji: str = "📁",
    sort_order: int = 0
) -> Category:
    """Создать категорию"""
    category = Category(
        name=name,
        description=description,
        emoji=emoji,
        sort_order=sort_order
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    logger.info(f"Создана категория: {name}")
    return category


def get_category(db: Session, category_id: int) -> Optional[Category]:
    """Получить категорию по ID"""
    return db.query(Category).filter(Category.id == category_id).first()


def get_category_by_name(db: Session, name: str) -> Optional[Category]:
    """Получить категорию по имени"""
    return db.query(Category).filter(Category.name == name).first()


def get_all_categories(db: Session, active_only: bool = True) -> list:
    """Получить все категории"""
    query = db.query(Category)
    if active_only:
        query = query.filter(Category.is_active == True)
    return query.order_by(Category.sort_order, Category.name).all()


def update_category(
    db: Session,
    category_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    emoji: Optional[str] = None,
    sort_order: Optional[int] = None,
    is_active: Optional[bool] = None
) -> Optional[Category]:
    """Обновить категорию"""
    category = get_category(db, category_id)
    if not category:
        return None
    
    if name is not None:
        category.name = name
    if description is not None:
        category.description = description
    if emoji is not None:
        category.emoji = emoji
    if sort_order is not None:
        category.sort_order = sort_order
    if is_active is not None:
        category.is_active = is_active
    
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, category_id: int) -> bool:
    """Удалить категорию"""
    category = get_category(db, category_id)
    if not category:
        return False
    db.delete(category)
    db.commit()
    logger.info(f"Удалена категория: {category.name}")
    return True


# ==================== FAQ QUESTION ====================

def create_faq_question(
    db: Session,
    category_id: int,
    question: str,
    answer: str,
    keywords: Optional[str] = None,
    sort_order: int = 0
) -> FAQQuestion:
    """Создать вопрос-ответ"""
    faq = FAQQuestion(
        category_id=category_id,
        question=question,
        answer=answer,
        keywords=keywords,
        sort_order=sort_order
    )
    db.add(faq)
    db.commit()
    db.refresh(faq)
    logger.info(f"Создан вопрос FAQ: {question[:50]}")
    return faq


def get_faq_question(db: Session, question_id: int) -> Optional[FAQQuestion]:
    """Получить вопрос по ID"""
    return db.query(FAQQuestion).filter(FAQQuestion.id == question_id).first()


def get_questions_by_category(
    db: Session,
    category_id: int,
    active_only: bool = True
) -> list:
    """Получить все вопросы категории"""
    query = db.query(FAQQuestion).filter(FAQQuestion.category_id == category_id)
    if active_only:
        query = query.filter(FAQQuestion.is_active == True)
    return query.order_by(FAQQuestion.sort_order, FAQQuestion.question).all()


def update_faq_question(
    db: Session,
    question_id: int,
    question: Optional[str] = None,
    answer: Optional[str] = None,
    keywords: Optional[str] = None,
    sort_order: Optional[int] = None,
    is_active: Optional[bool] = None
) -> Optional[FAQQuestion]:
    """Обновить вопрос-ответ"""
    faq = get_faq_question(db, question_id)
    if not faq:
        return None
    
    if question is not None:
        faq.question = question
    if answer is not None:
        faq.answer = answer
    if keywords is not None:
        faq.keywords = keywords
    if sort_order is not None:
        faq.sort_order = sort_order
    if is_active is not None:
        faq.is_active = is_active
    
    db.commit()
    db.refresh(faq)
    return faq


def delete_faq_question(db: Session, question_id: int) -> bool:
    """Удалить вопрос-ответ"""
    faq = get_faq_question(db, question_id)
    if not faq:
        return False
    db.delete(faq)
    db.commit()
    logger.info(f"Удален вопрос FAQ: {faq.question[:50]}")
    return True


def increment_question_views(db: Session, question_id: int) -> bool:
    """Увеличить счетчик просмотров вопроса"""
    faq = get_faq_question(db, question_id)
    if not faq:
        return False
    faq.views_count += 1
    db.commit()
    return True


def search_faq_questions(db: Session, query: str, limit: int = 10) -> list:
    """Поиск вопросов по ключевым словам"""
    query_lower = f"%{query.lower()}%"
    return db.query(FAQQuestion).filter(
        FAQQuestion.is_active == True,
        (FAQQuestion.question.ilike(query_lower)) |
        (FAQQuestion.keywords.ilike(query_lower)) |
        (FAQQuestion.answer.ilike(query_lower))
    ).limit(limit).all()


def get_faq_stats(db: Session) -> dict:
    """Получить статистику FAQ"""
    return {
        "total_categories": db.query(func.count(Category.id)).scalar(),
        "active_categories": db.query(func.count(Category.id)).filter(Category.is_active == True).scalar(),
        "total_questions": db.query(func.count(FAQQuestion.id)).scalar(),
        "active_questions": db.query(func.count(FAQQuestion.id)).filter(FAQQuestion.is_active == True).scalar(),
        "total_views": db.query(func.sum(FAQQuestion.views_count)).scalar() or 0
    }
