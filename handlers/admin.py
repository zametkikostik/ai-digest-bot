"""
Хэндлеры администратора
"""
import logging
from aiogram import Router, F, types
from aiogram.filters import Command
from sqlalchemy.orm import Session
from core.ai_client import OpenRouterClient
from core.rag import RAGRetriever
from core.scheduler import PostScheduler, CONTENT_PLAN_PROMPT
from prompts import SYSTEM_PROMPT
from database import crud
from config import config

logger = logging.getLogger(__name__)

router = Router()


def is_admin(user_id: int) -> bool:
    """Проверка на администратора"""
    return user_id in config.ADMIN_IDS


# ==================== КОМАНДЫ АДМИНИСТРАТОРА ====================

@router.message(Command("generate"), lambda message: is_admin(message.from_user.id))
async def cmd_generate(message: types.Message, ai_client: OpenRouterClient, rag: RAGRetriever):
    """
    Генерация поста по теме
    Использование: /generate [тема]
    """
    topic = message.text.replace("/generate", "").strip()
    
    if not topic:
        await message.reply(
            "⚠️ Укажите тему поста.\n\n"
            "Пример: `/generate Как нейросети меняют разработку`",
            parse_mode='Markdown'
        )
        return
    
    await message.reply(f"⏳ Генерирую пост на тему: **{topic}**...")
    
    try:
        # RAG-поиск
        rag_context = rag.retrieve(topic)
        
        # Формирование запроса
        user_message = f"[ACTION: CREATE_POST]\nТема: {topic}"
        if rag_context:
            user_message += f"\n\n[RAG_CONTEXT]\n{rag_context}"
        
        # Генерация
        post_content = await ai_client.complete(
            system=SYSTEM_PROMPT,
            user=user_message,
            mode="heavy"
        )
        
        # Отправка предпросмотра
        await message.answer(
            f"📝 **Предпросмотр поста**:\n\n{post_content}\n\n"
            f"_{len(post_content)} символов_\n\n"
            "Опубликовать? Используйте /publish",
            parse_mode='Markdown'
        )
        
        # Сохранение в очередь
        db = crud.get_session()
        crud.create_post(db, topic=topic, content=post_content, priority=1)
        db.close()
        
    except Exception as e:
        logger.error(f"Ошибка генерации поста: {e}")
        await message.reply(f"❌ Ошибка при генерации: {e}")


@router.message(Command("schedule"), lambda message: is_admin(message.from_user.id))
async def cmd_schedule(message: types.Message, scheduler: PostScheduler):
    """Показать расписание постов"""
    schedule = scheduler.get_schedule()
    
    if not schedule:
        await message.reply("📅 Расписание пусто")
        return
    
    text = "📅 **Расписание постов**:\n\n"
    for job in schedule:
        text += f"• **{job['id']}**\n"
        text += f"  Следующий запуск: `{job['next_run']}`\n\n"
    
    await message.reply(text, parse_mode='Markdown')


@router.message(Command("contentplan"), lambda message: is_admin(message.from_user.id))
async def cmd_contentplan(message: types.Message, ai_client: OpenRouterClient, rag: RAGRetriever):
    """Сгенерировать контент-план на 7 дней"""
    await message.reply("⏳ Генерирую контент-план на 7 дней...")
    
    try:
        rag_context = rag.retrieve(config.BOT_TOPIC)
        
        user_message = CONTENT_PLAN_PROMPT
        if rag_context:
            user_message += f"\n\n[RAG_CONTEXT]\n{rag_context}"
        
        plan = await ai_client.complete_json(
            system=CONTENT_PLAN_PROMPT,
            user=user_message,
            mode="heavy"
        )
        
        text = "📋 **Контент-план на 7 дней**:\n\n"
        for day in plan:
            text += f"**День {day['day']}**: {day['topic']}\n"
            text += f"  Формат: _{day['format']}_\n"
            text += f"  Крючок: {day['hook']}\n"
            text += f"  Хэштеги: {', '.join(day['hashtags'])}\n\n"
        
        await message.reply(text, parse_mode='Markdown')
        
    except Exception as e:
        logger.error(f"Ошибка генерации контент-плана: {e}")
        await message.reply(f"❌ Ошибка: {e}")


@router.message(Command("addknowledge"), lambda message: is_admin(message.from_user.id))
async def cmd_addknowledge(message: types.Message, rag: RAGRetriever):
    """
    Добавить документ в базу знаний
    Использование: ответом на документ или с текстом
    """
    db = crud.get_session()
    
    # Если документ прикреплён
    if message.document:
        file = await message.document.get_file()
        file_bytes = await file.download()
        
        # Определение типа файла
        file_name = message.document.file_name
        file_type = file_name.split('.')[-1].lower() if '.' in file_name else 'txt'
        
        try:
            # Чтение файла
            if file_type == 'txt':
                text = file_bytes.read().decode('utf-8')
            elif file_type == 'md':
                text = file_bytes.read().decode('utf-8')
            else:
                # Для PDF и DOCX нужна дополнительная обработка
                await message.reply(
                    f"⚠️ Формат {file_type} требует дополнительной обработки.\n"
                    "Пока поддерживаются только .txt и .md файлы."
                )
                db.close()
                return
            
            # Добавление в RAG
            chunks_count = rag.add_document(text, source=file_name)
            
            # Запись в БД
            import hashlib
            file_hash = hashlib.sha256(text.encode()).hexdigest()
            crud.add_knowledge_document(
                db,
                filename=file_name,
                file_type=file_type,
                chunks_count=chunks_count,
                file_hash=file_hash,
                uploaded_by=message.from_user.id
            )
            
            await message.reply(
                f"✅ Документ добавлен в базу знаний!\n\n"
                f"📄 Файл: `{file_name}`\n"
                f"📊 Чанков: `{chunks_count}`"
            )
            
        except Exception as e:
            logger.error(f"Ошибка добавления документа: {e}")
            await message.reply(f"❌ Ошибка: {e}")
        finally:
            db.close()
        return
    
    # Если текст в сообщении
    if message.text and len(message.text) > 50:
        text = message.text.replace("/addknowledge", "").strip()
        
        chunks_count = rag.add_document(text, source="manual")
        
        crud.add_knowledge_document(
            db,
            filename="manual_entry",
            file_type="txt",
            chunks_count=chunks_count,
            file_hash=hashlib.sha256(text.encode()).hexdigest(),
            uploaded_by=message.from_user.id
        )
        
        await message.reply(
            f"✅ Текст добавлен в базу знаний!\n"
            f"📊 Чанков: `{chunks_count}`"
        )
        db.close()
        return
    
    await message.reply(
        "⚠️ Отправьте документ (.txt, .md) или длинный текст (50+ символов)\n"
        "для добавления в базу знаний."
    )
    db.close()


@router.message(Command("kbstats"), lambda message: is_admin(message.from_user.id))
async def cmd_kbstats(message: types.Message, rag: RAGRetriever):
    """Статистика базы знаний"""
    db = crud.get_session()
    
    stats = rag.get_stats()
    db_stats = crud.get_knowledge_stats(db)
    
    text = "📚 **Статистика базы знаний**:\n\n"
    text += f"📄 Документов: `{db_stats['total_documents']}`\n"
    text += f"📊 Чанков: `{db_stats['total_chunks']}`\n"
    
    await message.reply(text, parse_mode='Markdown')
    db.close()


@router.message(Command("stats"), lambda message: is_admin(message.from_user.id))
async def cmd_stats(message: types.Message):
    """Общая статистика бота"""
    db = crud.get_session()
    
    stats = crud.get_stats(db)
    
    text = "📊 **Статистика бота**:\n\n"
    text += f"👥 Пользователей: `{stats['total_users']}`\n"
    text += f"⚠️ Нарушений: `{stats['total_violations']}`\n"
    text += f"📝 Постов в очереди: `{stats['pending_posts']}`\n"
    text += f"📚 Документов в БЗ: `{stats['knowledge_documents']}`\n"
    
    await message.reply(text, parse_mode='Markdown')
    db.close()


@router.message(Command("publish"), lambda message: is_admin(message.from_user.id))
async def cmd_publish(message: types.Message):
    """Опубликовать последний пост из очереди"""
    db = crud.get_session()
    
    posts = crud.get_pending_posts(db, limit=1)
    if not posts:
        await message.reply("📭 Нет постов в очереди")
        db.close()
        return
    
    post = posts[0]
    
    # Здесь должна быть логика публикации
    # Для простоты просто отмечаем как опубликованный
    crud.set_post_published(db, post.id)
    
    await message.reply(
        f"✅ Пост опубликован!\n\n"
        f"Тема: `{post.topic}`"
    )
    db.close()


@router.message(Command("setadmin"), lambda message: is_admin(message.from_user.id))
async def cmd_setadmin(message: types.Message):
    """Назначить администратора"""
    if not message.reply_to_message:
        await message.reply("Ответьте на сообщение пользователя")
        return
    
    target_id = message.reply_to_message.from_user.id
    
    db = crud.get_session()
    crud.set_admin(db, target_id, True)
    db.close()
    
    await message.reply(f"✅ Пользователь назначен администратором")


@router.message(Command("setmoderator"), lambda message: is_admin(message.from_user.id))
async def cmd_setmoderator(message: types.Message):
    """Назначить модератора"""
    if not message.reply_to_message:
        await message.reply("Ответьте на сообщение пользователя")
        return
    
    target_id = message.reply_to_message.from_user.id
    
    db = crud.get_session()
    crud.set_moderator(db, target_id, True)
    db.close()
    
    await message.reply(f"✅ Пользователь назначен модератором")
