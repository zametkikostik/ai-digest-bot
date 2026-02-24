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


# ==================== УПРАВЛЕНИЕ КАТЕГОРИЯМИ И FAQ ====================

@router.message(Command("addcategory"), lambda message: is_admin(message.from_user.id))
async def cmd_addcategory(message: types.Message):
    """
    Добавить категорию
    Использование: /addcategory Название|Описание|Emoji
    """
    args = message.text.replace("/addcategory", "").strip()
    
    if not args:
        await message.reply(
            "⚠️ Использование: `/addcategory Название|Описание|Emoji`\n\n"
            "Пример: `/addcategory AI Новости|Всё об искусственном интеллекте|🤖`",
            parse_mode='Markdown'
        )
        return
    
    parts = args.split("|")
    name = parts[0].strip()
    description = parts[1].strip() if len(parts) > 1 else None
    emoji = parts[2].strip() if len(parts) > 2 else "📁"
    
    db = crud.get_session()
    
    # Проверка на дубликат
    existing = crud.get_category_by_name(db, name)
    if existing:
        await message.reply(f"⚠️ Категория \"{name}\" уже существует")
        db.close()
        return
    
    category = crud.create_category(
        db,
        name=name,
        description=description,
        emoji=emoji
    )
    
    await message.reply(
        f"✅ Категория создана!\n\n"
        f"📁 Название: `{category.name}`\n"
        f"📝 Описание: `{category.description or 'Нет'}`\n"
        f"Emoji: `{category.emoji}`"
    )
    db.close()


@router.message(Command("editcategory"), lambda message: is_admin(message.from_user.id))
async def cmd_editcategory(message: types.Message):
    """
    Редактировать категорию
    Использование: /editcategory ID|Название|Описание|Emoji
    """
    args = message.text.replace("/editcategory", "").strip()
    
    if not args:
        await message.reply(
            "⚠️ Использование: `/editcategory ID|Название|Описание|Emoji`\n\n"
            "Пример: `/editcategory 1|AI Новости|Обновлённое описание|🤖`",
            parse_mode='Markdown'
        )
        return
    
    parts = args.split("|")
    try:
        category_id = int(parts[0].strip())
    except ValueError:
        await message.reply("⚠️ ID должен быть числом")
        return
    
    name = parts[1].strip() if len(parts) > 1 else None
    description = parts[2].strip() if len(parts) > 2 else None
    emoji = parts[3].strip() if len(parts) > 3 else None
    
    db = crud.get_session()
    category = crud.update_category(
        db,
        category_id=category_id,
        name=name,
        description=description,
        emoji=emoji
    )
    
    if not category:
        await message.reply(f"⚠️ Категория с ID {category_id} не найдена")
        db.close()
        return
    
    await message.reply(
        f"✅ Категория обновлена!\n\n"
        f"📁 Название: `{category.name}`\n"
        f"📝 Описание: `{category.description or 'Нет'}`\n"
        f"Emoji: `{category.emoji}`"
    )
    db.close()


@router.message(Command("deletecategory"), lambda message: is_admin(message.from_user.id))
async def cmd_deletecategory(message: types.Message):
    """
    Удалить категорию
    Использование: /deletecategory ID
    """
    args = message.text.replace("/deletecategory", "").strip()
    
    if not args:
        await message.reply(
            "⚠️ Использование: `/deletecategory ID`\n\n"
            "Пример: `/deletecategory 1`"
        )
        return
    
    try:
        category_id = int(args)
    except ValueError:
        await message.reply("⚠️ ID должен быть числом")
        return
    
    db = crud.get_session()
    
    if crud.delete_category(db, category_id):
        await message.reply(f"✅ Категория с ID {category_id} удалена")
    else:
        await message.reply(f"⚠️ Категория с ID {category_id} не найдена")
    
    db.close()


@router.message(Command("addquestion"), lambda message: is_admin(message.from_user.id))
async def cmd_addquestion(message: types.Message):
    """
    Добавить вопрос-ответ
    Использование: /addquestion CategoryID|Вопрос|Ответ|Ключевые слова
    """
    args = message.text.replace("/addquestion", "").strip()
    
    if not args:
        await message.reply(
            "⚠️ Использование: `/addquestion CategoryID|Вопрос|Ответ|Ключевые слова`\n\n"
            "Пример: `/addquestion 1|Что такое AI?|AI это искусственный интеллект|ai, искусственный интеллект`",
            parse_mode='Markdown'
        )
        return
    
    parts = args.split("|")
    if len(parts) < 3:
        await message.reply(
            "⚠️ Минимум 3 параметра: CategoryID|Вопрос|Ответ\n\n"
            "Пример: `/addquestion 1|Что такое AI?|AI это искусственный интеллект`",
            parse_mode='Markdown'
        )
        return
    
    try:
        category_id = int(parts[0].strip())
    except ValueError:
        await message.reply("⚠️ ID категории должен быть числом")
        return
    
    question = parts[1].strip()
    answer = parts[2].strip()
    keywords = parts[3].strip() if len(parts) > 3 else None
    
    db = crud.get_session()
    
    # Проверка существования категории
    category = crud.get_category(db, category_id)
    if not category:
        await message.reply(f"⚠️ Категория с ID {category_id} не найдена")
        db.close()
        return
    
    faq = crud.create_faq_question(
        db,
        category_id=category_id,
        question=question,
        answer=answer,
        keywords=keywords
    )
    
    await message.reply(
        f"✅ Вопрос добавлен!\n\n"
        f"❓ Вопрос: `{faq.question}`\n"
        f"💡 Ответ: `{faq.answer[:50]}...`\n"
        f"🏷️ Ключевые слова: `{faq.keywords or 'Нет'}`"
    )
    db.close()


@router.message(Command("editquestion"), lambda message: is_admin(message.from_user.id))
async def cmd_editquestion(message: types.Message):
    """
    Редактировать вопрос-ответ
    Использование: /editquestion ID|Вопрос|Ответ|Ключевые слова
    """
    args = message.text.replace("/editquestion", "").strip()
    
    if not args:
        await message.reply(
            "⚠️ Использование: `/editquestion ID|Вопрос|Ответ|Ключевые слова`",
            parse_mode='Markdown'
        )
        return
    
    parts = args.split("|")
    try:
        question_id = int(parts[0].strip())
    except ValueError:
        await message.reply("⚠️ ID должен быть числом")
        return
    
    question = parts[1].strip() if len(parts) > 1 else None
    answer = parts[2].strip() if len(parts) > 2 else None
    keywords = parts[3].strip() if len(parts) > 3 else None
    
    db = crud.get_session()
    faq = crud.update_faq_question(
        db,
        question_id=question_id,
        question=question,
        answer=answer,
        keywords=keywords
    )
    
    if not faq:
        await message.reply(f"⚠️ Вопрос с ID {question_id} не найден")
        db.close()
        return
    
    await message.reply(
        f"✅ Вопрос обновлён!\n\n"
        f"❓ Вопрос: `{faq.question}`\n"
        f"💡 Ответ: `{faq.answer[:50]}...`"
    )
    db.close()


@router.message(Command("deletequestion"), lambda message: is_admin(message.from_user.id))
async def cmd_deletequestion(message: types.Message):
    """
    Удалить вопрос-ответ
    Использование: /deletequestion ID
    """
    args = message.text.replace("/deletequestion", "").strip()
    
    if not args:
        await message.reply(
            "⚠️ Использование: `/deletequestion ID`\n\n"
            "Пример: `/deletequestion 1`"
        )
        return
    
    try:
        question_id = int(args)
    except ValueError:
        await message.reply("⚠️ ID должен быть числом")
        return
    
    db = crud.get_session()
    
    if crud.delete_faq_question(db, question_id):
        await message.reply(f"✅ Вопрос с ID {question_id} удалён")
    else:
        await message.reply(f"⚠️ Вопрос с ID {question_id} не найден")
    
    db.close()


@router.message(Command("listcategories"), lambda message: is_admin(message.from_user.id))
async def cmd_listcategories(message: types.Message):
    """Показать все категории"""
    db = crud.get_session()
    categories = crud.get_all_categories(db, active_only=False)
    db.close()
    
    if not categories:
        await message.reply("📭 Категории пока не созданы")
        return
    
    text = "📚 **Все категории**:\n\n"
    for cat in categories:
        questions_count = cat.questions.count() if hasattr(cat.questions, 'count') else 0
        status = "✅" if cat.is_active else "❌"
        text += f"{status} **ID {cat.id}**: {cat.emoji} {cat.name} ({questions_count} вопросов)\n"
    
    await message.reply(text, parse_mode='Markdown')


@router.message(Command("listquestions"), lambda message: is_admin(message.from_user.id))
async def cmd_listquestions(message: types.Message):
    """Показать вопросы категории"""
    args = message.text.replace("/listquestions", "").strip()
    
    if not args:
        await message.reply(
            "⚠️ Использование: `/listquestions CategoryID`\n\n"
            "Пример: `/listquestions 1`",
            parse_mode='Markdown'
        )
        return
    
    try:
        category_id = int(args)
    except ValueError:
        await message.reply("⚠️ ID категории должен быть числом")
        return
    
    db = crud.get_session()
    category = crud.get_category(db, category_id)
    if not category:
        await message.reply(f"⚠️ Категория с ID {category_id} не найдена")
        db.close()
        return
    
    questions = crud.get_questions_by_category(db, category_id, active_only=False)
    db.close()
    
    if not questions:
        await message.reply(f"📭 В категории \"{category.name}\" нет вопросов")
        return
    
    text = f"📚 **Вопросы категории \"{category.name}\"**:\n\n"
    for faq in questions:
        status = "✅" if faq.is_active else "❌"
        text += f"{status} **ID {faq.id}**: {faq.question[:50]}{'...' if len(faq.question) > 50 else ''}\n"
        text += f"   👁️ Просмотров: {faq.views_count}\n\n"
    
    await message.reply(text, parse_mode='Markdown')


@router.message(Command("faqs"), lambda message: is_admin(message.from_user.id))
async def cmd_faqs(message: types.Message):
    """Статистика FAQ"""
    db = crud.get_session()
    stats = crud.get_faq_stats(db)
    db.close()
    
    text = "📚 **Статистика FAQ**:\n\n"
    text += f"📁 Категорий (всего/активных): `{stats['total_categories']}/{stats['active_categories']}`\n"
    text += f"❓ Вопросов (всего/активных): `{stats['total_questions']}/{stats['active_questions']}`\n"
    text += f"👁️ Всего просмотров: `{stats['total_views']}`\n"
    
    await message.reply(text, parse_mode='Markdown')
