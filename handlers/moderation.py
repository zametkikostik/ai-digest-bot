"""
Хэндлеры модерации
"""
import logging
import re
from typing import Optional
from aiogram import Router, F, types
from aiogram.filters import Command
from aiogram.enums import ChatMemberStatus
from sqlalchemy.orm import Session
from core.ai_client import OpenRouterClient
from core.moderation import moderate, ModerationResult, MODERATION_PROMPT
from database import crud
from config import config

logger = logging.getLogger(__name__)

router = Router()


async def get_user_status(bot: types.Bot, chat_id: int, user_id: int) -> Optional[str]:
    """Получить статус пользователя в чате"""
    try:
        member = await bot.get_chat_member(chat_id, user_id)
        return member.status
    except Exception:
        return None


def is_moderator_or_admin(user_id: int, db: Session) -> bool:
    """Проверка на модератора или администратора"""
    if user_id in config.ADMIN_IDS:
        return True
    user = crud.get_user(db, user_id)
    if user and (user.is_admin or user.is_moderator):
        return True
    return False


# ==================== КОМАНДЫ МОДЕРАТОРА ====================

@router.message(Command("ban"))
async def cmd_ban(message: types.Message, bot: types.Bot):
    """
    Забанить пользователя
    Использование: /ban @username или ответом на сообщение
    """
    db = crud.get_session()
    
    if not is_moderator_or_admin(message.from_user.id, db):
        db.close()
        return
    
    target_id = None
    target_username = None
    
    # Если есть упоминание
    if message.entities:
        for entity in message.entities:
            if entity.type == "mention":
                target_username = message.text[entity.offset:entity.offset + entity.length]
                break
    
    # Если ответ на сообщение
    if message.reply_to_message:
        target_id = message.reply_to_message.from_user.id
        target_username = message.reply_to_message.from_user.username
    
    if not target_id and not target_username:
        await message.reply("⚠️ Укажите пользователя: @username или ответьте на сообщение")
        db.close()
        return
    
    # Если только username — нужно найти ID (упрощённо)
    if target_id:
        crud.ban_user(db, target_id)
        
        # Логирование нарушения
        crud.log_violation(
            db,
            telegram_id=target_id,
            action="ban",
            reason="Manual ban by moderator",
            confidence=1.0,
            message_text=""
        )
        
        # Попытка кика
        try:
            await bot.ban_chat_member(message.chat.id, target_id)
            await message.reply(f"🔨 Пользователь забанен: {target_username or target_id}")
        except Exception as e:
            logger.error(f"Ошибка при бане: {e}")
            await message.reply(f"⚠️ Пользователь добавлен в чёрный список бота\nОшибка кика: {e}")
    
    db.close()


@router.message(Command("unban"))
async def cmd_unban(message: types.Message):
    """
    Разбанить пользователя
    """
    db = crud.get_session()
    
    if not is_moderator_or_admin(message.from_user.id, db):
        db.close()
        return
    
    target_id = None
    
    if message.reply_to_message:
        target_id = message.reply_to_message.from_user.id
    
    if not target_id:
        await message.reply("⚠️ Ответьте на сообщение пользователя")
        db.close()
        return
    
    crud.unban_user(db, target_id)
    crud.reset_warnings(db, target_id)
    
    await message.reply("✅ Пользователь разбанен")
    db.close()


@router.message(Command("warn"))
async def cmd_warn(message: types.Message):
    """
    Выдать предупреждение
    """
    db = crud.get_session()
    
    if not is_moderator_or_admin(message.from_user.id, db):
        db.close()
        return
    
    target_id = None
    reason = "Manual warning by moderator"
    
    if message.reply_to_message:
        target_id = message.reply_to_message.from_user.id
        # Извлечение причины из текста команды
        if message.text and "/warn" in message.text:
            reason = message.text.replace("/warn", "").strip() or reason
    
    if not target_id:
        await message.reply("⚠️ Ответьте на сообщение пользователя")
        db.close()
        return
    
    warnings_count = crud.add_warning(db, target_id)
    
    crud.log_violation(
        db,
        telegram_id=target_id,
        action="warn",
        reason=reason,
        confidence=1.0,
        message_text=""
    )
    
    text = f"⚠️ Предупреждение выдано\n"
    text += f"Всего предупреждений: {warnings_count}\n\n"
    
    if warnings_count >= 3:
        text += "🔨 Автоматический бан (3 предупреждения)"
        crud.ban_user(db, target_id)
    
    await message.reply(text)
    db.close()


@router.message(Command("mute"))
async def cmd_mute(message: types.Message, bot: types.Bot):
    """
    Замутить пользователя (ограничить права)
    """
    db = crud.get_session()
    
    if not is_moderator_or_admin(message.from_user.id, db):
        db.close()
        return
    
    if not message.reply_to_message:
        await message.reply("⚠️ Ответьте на сообщение пользователя")
        db.close()
        return
    
    target_id = message.reply_to_message.from_user.id
    
    try:
        # Мут на 1 час
        await bot.restrict_chat_member(
            message.chat.id,
            target_id,
            until_date=None,  # Можно установить время
            permissions=types.ChatPermissions(
                can_send_messages=False,
                can_send_media_messages=False,
                can_send_other_messages=False,
                can_add_web_page_previews=False
            )
        )
        await message.reply("🔇 Пользователь замучен")
    except Exception as e:
        logger.error(f"Ошибка при муте: {e}")
        await message.reply(f"⚠️ Ошибка: {e}")
    
    db.close()


@router.message(Command("del"), lambda message: is_moderator_or_admin(message.from_user.id, crud.get_session()))
async def cmd_delete(message: types.Message):
    """
    Удалить сообщение
    """
    db = crud.get_session()
    
    if not message.reply_to_message:
        await message.reply("⚠️ Ответьте на сообщение для удаления")
        db.close()
        return
    
    try:
        await message.reply_to_message.delete()
        await message.reply("🗑️ Сообщение удалено")
    except Exception as e:
        logger.error(f"Ошибка при удалении: {e}")
        await message.reply(f"⚠️ Ошибка: {e}")
    finally:
        db.close()


@router.message(Command("clear"), lambda message: is_moderator_or_admin(message.from_user.id, crud.get_session()))
async def cmd_clear(message: types.Message):
    """
    Очистить последние N сообщений
    Использование: /clear [count]
    """
    if not message.reply_to_message:
        await message.reply("⚠️ Ответьте на сообщение, до которого очистить")
        return
    
    # Извлечение количества
    count = 10
    if message.text and "/clear" in message.text:
        try:
            count = int(message.text.replace("/clear", "").strip())
            count = max(1, min(count, 100))  # 1-100
        except ValueError:
            pass
    
    await message.reply(f"🧹 Удаляю последние {count} сообщений...")
    
    deleted = 0
    try:
        async for msg in message.chat.history(limit=count + 1):
            if msg.message_id >= message.reply_to_message.message_id:
                try:
                    await msg.delete()
                    deleted += 1
                except Exception:
                    pass
    except Exception as e:
        logger.error(f"Ошибка при очистке: {e}")
    
    await message.reply(f"✅ Удалено {deleted} сообщений")


# ==================== АВТОМОДЕРАЦИЯ ====================

@router.message()
async def auto_moderate(message: types.Message, ai_client: OpenRouterClient):
    """
    Автоматическая модерация всех сообщений
    """
    db = crud.get_session()
    
    # Пропуск админов и модераторов
    if is_moderator_or_admin(message.from_user.id, db):
        db.close()
        return
    
    # Пропуск ботов
    if message.from_user.is_bot:
        db.close()
        return
    
    # Проверка на забаненного
    user = crud.get_user(db, message.from_user.id)
    if user and user.is_banned:
        try:
            await message.delete()
        except Exception:
            pass
        db.close()
        return
    
    db.close()
    
    # Получение текста
    text = message.text or message.caption
    if not text:
        return
    
    # Получение предыдущих сообщений пользователя (для флуда)
    db = crud.get_session()
    context = crud.get_conversation_context(db, message.from_user.id) or []
    previous_messages = [
        msg["content"] for msg in context[-5:]
        if msg.get("role") == "user"
    ]
    db.close()
    
    try:
        # Модерация
        result: ModerationResult = await moderate(
            text=text,
            ai_client=ai_client,
            system_prompt=MODERATION_PROMPT,
            previous_messages=previous_messages,
            use_ai=True
        )
        
        logger.info(
            f"Модерация от {message.from_user.id}: "
            f"{result.action} - {result.reason}"
        )
        
        # Применение действий
        if result.action == "delete":
            try:
                await message.delete()
            except Exception as e:
                logger.error(f"Ошибка при удалении сообщения: {e}")
            
            # Логирование
            db = crud.get_session()
            crud.log_violation(
                db,
                telegram_id=message.from_user.id,
                action="delete",
                reason=result.reason,
                confidence=result.confidence,
                message_text=text
            )
            db.close()
        
        elif result.action == "warn":
            db = crud.get_session()
            warnings_count = crud.add_warning(db, message.from_user.id)
            
            crud.log_violation(
                db,
                telegram_id=message.from_user.id,
                action="warn",
                reason=result.reason,
                confidence=result.confidence,
                message_text=text
            )
            
            if warnings_count >= 3:
                crud.ban_user(db, message.from_user.id)
                try:
                    await message.chat.ban_member(message.from_user.id)
                except Exception:
                    pass
                await message.reply(
                    f"🔨 Вы забанены (3 предупреждения)\n"
                    f"Обратитесь к администратору."
                )
            else:
                await message.reply(
                    f"⚠️ Предупреждение: {result.reason}\n"
                    f"Предупреждений: {warnings_count}/3"
                )
            
            db.close()
        
        elif result.action == "ban":
            db = crud.get_session()
            crud.ban_user(db, message.from_user.id)
            db.close()
            
            try:
                await message.delete()
                await message.chat.ban_member(message.from_user.id)
            except Exception as e:
                logger.error(f"Ошибка при бане: {e}")
    
    except Exception as e:
        logger.error(f"Ошибка автоматической модерации: {e}")
