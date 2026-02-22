/**
 * AI Digest Bot - Telegram Bot для Cloudflare Workers
 * Автопостинг, ответы пользователям, AI модерация
 */

// === КОНФИГУРАЦИЯ ===
const CHANNEL_ID = "-1001859702206";  // ai_world_russia
const ADMIN_IDS = ["1271633868"];  // Ваш ID

const MODELS = {
  heavy: "qwen/qwen3-235b-a22b:free",
  reason: "deepseek/deepseek-r1:free",
  fast: "mistralai/mistral-7b-instruct:free",
};

const SYSTEM_PROMPT = `
Ты — AI-ассистент "AI-дайджест".
Тематика: Искусственный интеллект, нейросети, технологии.

РЕЖИМЫ:
- [ACTION: CREATE_POST] — создание поста для Telegram канала
- [ACTION: USER_REPLY] — ответ пользователю на вопрос
- [ACTION: MODERATE] — модерация (верни JSON: {"action":"allow|warn|delete|ban","reason":"...","confidence":0.5})

ПРАВИЛА:
- Отвечай на русском языке
- Используй Markdown форматирование
- Для постов: заголовок с эмодзи, тело поста 500-1000 символов, 3-5 хэштегов, призыв к действию
- Для ответов: кратко, по делу, экспертно
- Для модерации: ТОЛЬКО JSON без пояснений
`;

// Темы для автопостинга
const AUTO_POST_TOPICS = [
  "Последние новости ИИ за неделю",
  "Новые AI инструменты для разработчиков",
  "Как нейросети меняют работу дизайнеров",
  "Обзор GPT-4 vs Claude vs Gemini",
  "AI для автоматизации бизнеса",
  "Как создать свой AI стартап",
  "Топ-10 AI библиотек 2026",
  "Будущее искусственного интеллекта",
  "AI в медицине: прорывы",
  "Как заработать на нейросетях",
  "Обучение нейросетей с нуля",
  "AI генерация изображений: Midjourney vs DALL-E",
  "Чат-боты на базе GPT",
  "AI для написания кода",
  "Этика искусственного интеллекта"
];

// === AI КЛИЕНТ ===
async function openRouterComplete(env, system, user, mode = "fast") {
  const url = "https://openrouter.ai/api/v1/chat/completions";
  
  const payload = {
    model: MODELS[mode],
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    max_tokens: 2048,
    temperature: 0.7
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://your-bot.com",
      "X-Title": "TelegramBot-CF",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function openRouterCompleteJSON(env, system, user, mode = "reason") {
  const text = await openRouterComplete(env, system, user, mode);
  try {
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { action: "allow", reason: "Parse error", confidence: 0.5 };
  }
}

// === TELEGRAM API ===
async function sendMessage(token, chatId, text, parseMode = "Markdown") {
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: parseMode,
        disable_web_page_preview: true
      })
    });
    
    return response.json();
  } catch (e) {
    console.error("sendMessage error:", e);
    return { ok: false, error: e.message };
  }
}

async function sendPostToChannel(token, channelId, text) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: channelId,
      text: text,
      parse_mode: "Markdown"
    })
  });
  
  return response.json();
}

async function deleteMessage(token, chatId, messageId) {
  const url = `https://api.telegram.org/bot${token}/deleteMessage`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId
    })
  });
  
  return response.json();
}

async function banUser(token, chatId, userId) {
  const url = `https://api.telegram.org/bot${token}/banChatMember`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      user_id: userId
    })
  });
  
  return response.json();
}

// === RAG ПОИСК ===
async function ragRetrieve(env, query, topK = 3) {
  try {
    const keys = await env.RAG_STORE.list();
    const results = [];
    
    for (const key of keys.keys.slice(0, Math.min(topK, keys.keys.length))) {
      const value = await env.RAG_STORE.get(key.name);
      if (value) results.push(value);
    }
    
    return results.join("\n\n---\n\n");
  } catch (e) {
    console.error("RAG error:", e);
    return "";
  }
}

// === МОДЕРАЦИЯ ===
const SPAM_PATTERNS = [
  /https?:\/\/\S+/i,
  /@[a-zA-Z0-9_]{5,}/,
  /(заработ|казино|крипто|инвест).{0,30}(денег|прибыль)/i,
  /(18\+|порно|секс)/i,
];

function quickModerate(text) {
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      return { action: "delete", reason: "Spam pattern", confidence: 0.95 };
    }
  }
  return null;
}

// === ОБРАБОТКА WEBHOOK ===
export default {
  async fetch(request, env, ctx) {
    // Health check
    if (request.method === "GET") {
      return new Response("AI Digest Bot is running! 🤖\nАвтопостинг + Модерация", {
        headers: { "Content-Type": "text/plain" }
      });
    }

    // Webhook от Telegram
    if (request.method === "POST") {
      try {
        const update = await request.json();
        console.log("Update:", JSON.stringify(update));
        
        // Сообщение от пользователя
        if (update.message) {
          const message = update.message;
          const chatId = message.chat.id;
          const text = message.text || "";
          const firstName = message.from?.first_name || "User";
          const userId = message.from?.id?.toString();
          const chatType = message.chat.type;
          const isAdmin = ADMIN_IDS.includes(userId);

          console.log(`${chatType} from ${firstName} (${userId}): ${text}`);

          // Модерация в группах
          if (chatType === "group" || chatType === "supergroup") {
            await handleGroupMessage(message, text, env, chatId, userId, firstName, isAdmin);
            return new Response("OK", { status: 200 });
          }

          // Личный чат с ботом
          if (chatType === "private") {
            if (text.startsWith("/")) {
              await handlePrivateCommand(message, text, env, chatId, firstName, userId, isAdmin);
            } else {
              await handlePrivateMessage(message, text, env, chatId, firstName);
            }
          }
        }

        return new Response("OK", { status: 200 });

      } catch (error) {
        console.error("Error:", error);
        return new Response(`Error: ${error.message}`, { status: 500 });
      }
    }

    return new Response("Method not allowed", { status: 405 });
  },

  // CRON для автопостинга (каждые 30 минут)
  async scheduled(event, env, ctx) {
    console.log("Running scheduled task...");
    
    try {
      // Выбираем случайную тему
      const randomTopic = AUTO_POST_TOPICS[Math.floor(Math.random() * AUTO_POST_TOPICS.length)];
      
      console.log(`Generating post about: ${randomTopic}`);
      
      // Генерация поста
      const postMsg = `[ACTION: CREATE_POST]\nТема: ${randomTopic}`;
      const post = await openRouterComplete(env, SYSTEM_PROMPT, postMsg, "heavy");
      
      // Публикация в канал
      const result = await sendPostToChannel(env.BOT_TOKEN, CHANNEL_ID, post);
      
      if (result.ok) {
        console.log(`Post published to ${CHANNEL_ID}`);
      } else {
        console.error("Failed to publish:", result);
      }
    } catch (error) {
      console.error("Scheduled task error:", error);
    }
  }
};

// === ОБРАБОТКА КОМАНД В ЛИЧНОМ ЧАТЕ ===
async function handlePrivateCommand(message, text, env, chatId, firstName, userId, isAdmin) {
  const parts = text.split(" ");
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(" ").trim();

  let responseText = "";

  switch (command) {
    case "/start":
      responseText = `👋 Привет, ${firstName}!

Я — **AI-дайджест**, твой умный помощник по миру ИИ.

📋 **Что я умею**:
• Отвечаю на вопросы про ИИ и технологии
• Помогаю с кодом и нейросетями
• Создаю посты для Telegram каналов
• Модерирую чаты (если добавить в группу)

📝 **Команды**:
• /help — подробная справка
• /ask [вопрос] — задать вопрос AI
• /search [запрос] — поиск в базе знаний
• /rules — правила
• /generate [тема] — создать пост (admin)
• /post [тема] — опубликовать в канал (admin)

💡 Напиши мне любой вопрос — я отвечу!`;
      break;

    case "/help":
      responseText = `📖 **Полная справка**:

**Для всех**:
/start — приветствие
/ask [вопрос] — задать вопрос AI
/search [запрос] — поиск в базе
/rules — правила чата

**Просто напиши вопрос** — я отвечу!

**Для админов**:
/generate [тема] — создать пост
/post [тема] — опубликовать в канал
/stats — статистика

**Для групп**:
Добавь меня в группу — я буду:
• Модерировать спам
• Отвечать на вопросы
• Помогать участникам`;
      break;

    case "/rules":
      responseText = `📜 **Правила**:

1️⃣ Уважайте собеседников
2️⃣ Без спама и рекламы
3️⃣ Без оскорблений и мата
4️⃣ Без NSFW контента
5️⃣ Без фейков и дезинформации

⚠️ Нарушения = бан!`;
      break;

    case "/ask":
      if (!args) {
        responseText = "⚠️ Задайте вопрос!\n\nПример: `/ask Как работает трансформер?`";
        break;
      }
      
      const ragContext = await ragRetrieve(env, args);
      const userMsg = `[ACTION: USER_REPLY]\nВопрос: ${args}` + 
        (ragContext ? `\n\n[RAG_CONTEXT]\n${ragContext}` : "");
      
      const answer = await openRouterComplete(env, SYSTEM_PROMPT, userMsg, "fast");
      responseText = `🤖 **Ответ на вопрос**:\n\n${answer}`;
      break;

    case "/search":
      if (!args) {
        responseText = "⚠️ Введите запрос!\n\nПример: `/search GPT модели`";
        break;
      }
      
      const searchResults = await ragRetrieve(env, args, 5);
      responseText = searchResults 
        ? `🔍 **Результаты**:\n\n${searchResults}`
        : "🔍 Ничего не найдено";
      break;

    case "/generate":
      if (!isAdmin) {
        responseText = "⛔ Только для администраторов";
        break;
      }
      
      if (!args) {
        responseText = "⚠️ Укажите тему!\n\nПример: `/generate Новости ИИ`";
        break;
      }
      
      const postRag = await ragRetrieve(env, args);
      const postMsg = `[ACTION: CREATE_POST]\nТема: ${args}` +
        (postRag ? `\n\n[RAG_CONTEXT]\n${postRag}` : "");
      
      const post = await openRouterComplete(env, SYSTEM_PROMPT, postMsg, "heavy");
      responseText = `📝 **Пост**:\n\n${post}\n\n/post ${args} — опубликовать`;
      
      await env.RAG_STORE.put(`pending_post_${userId}`, post);
      break;

    case "/post":
      if (!isAdmin) {
        responseText = "⛔ Только для администраторов";
        break;
      }
      
      if (!args) {
        responseText = "⚠️ Укажите тему!\n\nПример: `/post Нейросети`";
        break;
      }
      
      try {
        const quickRag = await ragRetrieve(env, args);
        const quickMsg = `[ACTION: CREATE_POST]\nТема: ${args}` +
          (quickRag ? `\n\n[RAG_CONTEXT]\n${quickRag}` : "");
        
        const quickPost = await openRouterComplete(env, SYSTEM_PROMPT, quickMsg, "heavy");
        const result = await sendPostToChannel(env.BOT_TOKEN, CHANNEL_ID, quickPost);
        
        if (result.ok) {
          responseText = `✅ Опубликовано в ai_world_russia!`;
        } else {
          responseText = `❌ Ошибка публикации: ${result.description || 'Не удалось опубликовать'}`;
        }
      } catch (e) {
        responseText = `❌ Ошибка: ${e.message}`;
      }
      break;

    case "/stats":
      if (!isAdmin) {
        responseText = "⛔ Только для администраторов";
        break;
      }
      
      const keys = await env.RAG_STORE.list();
      responseText = `📊 **Статистика**:\n\n📚 Документов в базе: ${keys.keys.length}`;
      break;

    default:
      responseText = "❓ Неизвестная команда. Используйте /help";
  }

  if (responseText) {
    await sendMessage(env.BOT_TOKEN, chatId, responseText);
  }
}

// === ОБРАБОТКА ОБЫЧНЫХ СООБЩЕНИЙ В ЛИЧНОМ ЧАТЕ ===
async function handlePrivateMessage(message, text, env, chatId, firstName) {
  // RAG поиск
  const ragContext = await ragRetrieve(env, text);
  
  // Запрос к AI
  const userMsg = `[ACTION: USER_REPLY]\nСообщение от ${firstName}: ${text}` +
    (ragContext ? `\n\n[RAG_CONTEXT]\n${ragContext}` : "");
  
  const answer = await openRouterComplete(env, SYSTEM_PROMPT, userMsg, "fast");
  
  await sendMessage(env.BOT_TOKEN, chatId, answer);
}

// === ОБРАБОТКА СООБЩЕНИЙ В ГРУППАХ ===
async function handleGroupMessage(message, text, env, chatId, userId, firstName, isAdmin) {
  // Пропускаем админов и ботов
  if (isAdmin || message.from?.is_bot) {
    return;
  }

  // Быстрая модерация
  const quickMod = quickModerate(text);
  if (quickMod && quickMod.action === "delete") {
    await deleteMessage(env.BOT_TOKEN, chatId, message.message_id);
    await sendMessage(env.BOT_TOKEN, chatId, `⚠️ ${firstName}, спам запрещён!`);
    return;
  }

  // AI модерация
  const aiMod = await openRouterCompleteJSON(
    env,
    SYSTEM_PROMPT,
    `[ACTION: MODERATE]\n${text}`,
    "reason"
  );

  if (aiMod.action === "delete") {
    await deleteMessage(env.BOT_TOKEN, chatId, message.message_id);
    await sendMessage(env.BOT_TOKEN, chatId, 
      `⚠️ ${firstName}, ${aiMod.reason}`);
    return;
  }

  if (aiMod.action === "ban") {
    await deleteMessage(env.BOT_TOKEN, chatId, message.message_id);
    await banUser(env.BOT_TOKEN, chatId, userId);
    await sendMessage(env.BOT_TOKEN, chatId, `🔨 ${firstName} забанен!`);
    return;
  }

  // Если вопрос к боту (упоминание или ответ)
  if (message.reply_to_message?.from?.is_bot || text.includes("@AidenHelpbot")) {
    const cleanText = text.replace("@AidenHelpbot", "").trim();
    
    if (cleanText) {
      const ragContext = await ragRetrieve(env, cleanText);
      const userMsg = `[ACTION: USER_REPLY]\nВопрос в группе от ${firstName}: ${cleanText}` +
        (ragContext ? `\n\n[RAG_CONTEXT]\n${ragContext}` : "");
      
      const answer = await openRouterComplete(env, SYSTEM_PROMPT, userMsg, "fast");
      
      await sendMessage(env.BOT_TOKEN, chatId, `🤖 **Ответ**:\n\n${answer}`);
    }
  }
}
