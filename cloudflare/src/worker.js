/**
 * AI Digest Bot - Telegram Bot для Cloudflare Workers
 * Постинг в канал, ответы пользователям, модерация
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
Ты — AI-ассистент Telegram-канала "AI-дайджест".
Тематика: Всё об искусственном интеллекте за неделю. Новости, инструменты, лайфхаки.

РЕЖИМЫ:
- [ACTION: CREATE_POST] — создание поста для канала
- [ACTION: USER_REPLY] — ответ пользователю

ПРАВИЛА:
- Отвечай на русском
- Используй Markdown форматирование
- При создании поста: заголовок с эмодзи, тело поста, 3-5 хэштегов, призыв к действию
`;

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

// === TELEGRAM API ===
async function sendMessage(token, chatId, text, parseMode = "Markdown") {
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

// === RAG ПОИСК ===
async function ragRetrieve(env, query, topK = 3) {
  try {
    const keys = await env.RAG_STORE.list();
    const results = [];
    
    for (const key of keys.keys.slice(0, topK)) {
      const value = await env.RAG_STORE.get(key.name);
      if (value) results.push(value);
    }
    
    return results.join("\n\n---\n\n");
  } catch (e) {
    console.error("RAG error:", e);
    return "";
  }
}

// === ОБРАБОТКА WEBHOOK ===
export default {
  async fetch(request, env, ctx) {
    // Health check
    if (request.method === "GET") {
      return new Response("AI Digest Bot is running! 🤖\nChannel: ai_world_russia", {
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
          const isAdmin = ADMIN_IDS.includes(userId);

          console.log(`Message from ${firstName} (${userId}): ${text}`);

          // Обработка команд
          if (text.startsWith("/")) {
            await handleCommand(message, text, env, chatId, firstName, userId, isAdmin);
          } else {
            // Обычное сообщение
            await handleUserMessage(message, text, env, chatId, firstName);
          }
        }

        return new Response("OK", { status: 200 });

      } catch (error) {
        console.error("Error:", error);
        return new Response(`Error: ${error.message}`, { status: 500 });
      }
    }

    return new Response("Method not allowed", { status: 405 });
  }
};

// === ОБРАБОТКА КОМАНД ===
async function handleCommand(message, text, env, chatId, firstName, userId, isAdmin) {
  const parts = text.split(" ");
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(" ").trim();

  let responseText = "";

  switch (command) {
    case "/start":
      responseText = `👋 Привет, ${firstName}!

Я — **AI-дайджест**, твой помощник по миру ИИ.

📋 **Команды**:
• /help — справка
• /ask [вопрос] — вопрос AI
• /search [запрос] — поиск в базе
• /rules — правила чата

💡 Просто напиши мне, и я отвечу!`;
      break;

    case "/help":
      responseText = `📖 **Справка**:

**Для всех**:
/start — приветствие
/help — эта справка
/ask [вопрос] — задать вопрос AI
/search [запрос] — поиск в базе знаний
/rules — правила чата

**Для админов**:
/generate [тема] — создать пост для канала
/post [тема] — опубликовать пост в канал`;
      break;

    case "/rules":
      responseText = `📜 **Правила чата**:

1️⃣ Уважайте участников
2️⃣ Без спама и рекламы
3️⃣ Без оскорблений
4️⃣ Без NSFW контента
5️⃣ Без персональных данных
6️⃣ Соблюдайте тему канала

⚠️ Нарушения ведут к бану!`;
      break;

    case "/ask":
      if (!args) {
        responseText = "⚠️ Задайте вопрос!\n\nПример: `/ask Как работает GPT?`";
        break;
      }
      
      // RAG поиск
      const ragContext = await ragRetrieve(env, args);
      
      // Запрос к AI
      const userMsg = `[ACTION: USER_REPLY]\nВопрос: ${args}` + 
        (ragContext ? `\n\n[RAG_CONTEXT]\n${ragContext}` : "");
      
      const answer = await openRouterComplete(env, SYSTEM_PROMPT, userMsg, "fast");
      responseText = `🤖 **Ответ**:\n\n${answer}`;
      break;

    case "/search":
      if (!args) {
        responseText = "⚠️ Введите запрос!\n\nПример: `/search нейросети`";
        break;
      }
      
      const searchResults = await ragRetrieve(env, args, 5);
      responseText = searchResults 
        ? `🔍 **Результаты поиска**:\n\n${searchResults}`
        : "🔍 Ничего не найдено";
      break;

    case "/generate":
      if (!isAdmin) {
        responseText = "⛔ Эта команда только для администраторов";
        break;
      }
      
      if (!args) {
        responseText = "⚠️ Укажите тему поста!\n\nПример: `/generate Новости ИИ за неделю`";
        break;
      }
      
      // Генерация поста
      const postRag = await ragRetrieve(env, args);
      const postMsg = `[ACTION: CREATE_POST]\nТема: ${args}` +
        (postRag ? `\n\n[RAG_CONTEXT]\n${postRag}` : "");
      
      const post = await openRouterComplete(env, SYSTEM_PROMPT, postMsg, "heavy");
      
      responseText = `📝 **Предпросмотр поста**:\n\n${post}\n\n_Отправьте /publish для публикации_`;
      
      // Сохраняем пост в KV для публикации
      await env.RAG_STORE.put(`pending_post_${userId}`, post);
      break;

    case "/post":
      if (!isAdmin) {
        responseText = "⛔ Эта команда только для администраторов";
        break;
      }
      
      if (!args) {
        responseText = "⚠️ Укажите тему!\n\nПример: `/post Новости ИИ`";
        break;
      }
      
      // Генерация и публикация
      const quickRag = await ragRetrieve(env, args);
      const quickMsg = `[ACTION: CREATE_POST]\nТема: ${args}` +
        (quickRag ? `\n\n[RAG_CONTEXT]\n${quickRag}` : "");
      
      const quickPost = await openRouterComplete(env, SYSTEM_PROMPT, quickMsg, "heavy");
      
      // Публикация в канал
      const result = await sendPostToChannel(env.BOT_TOKEN, CHANNEL_ID, quickPost);
      
      if (result.ok) {
        responseText = `✅ Пост опубликован в канале!\n\nТема: ${args}`;
      } else {
        responseText = `❌ Ошибка публикации: ${result.description}`;
      }
      break;

    case "/publish":
      if (!isAdmin) {
        responseText = "⛔ Эта команда только для администраторов";
        break;
      }
      
      // Получаем сохранённый пост
      const savedPost = await env.RAG_STORE.get(`pending_post_${userId}`);
      
      if (!savedPost) {
        responseText = "⚠️ Нет сохранённого поста. Используйте /generate [тема]";
        break;
      }
      
      // Публикация
      const pubResult = await sendPostToChannel(env.BOT_TOKEN, CHANNEL_ID, savedPost);
      
      if (pubResult.ok) {
        responseText = "✅ Пост опубликован в канале!";
        await env.RAG_STORE.delete(`pending_post_${userId}`);
      } else {
        responseText = `❌ Ошибка: ${pubResult.description}`;
      }
      break;

    default:
      responseText = "❓ Неизвестная команда. Используйте /help";
  }

  // Отправляем ответ
  if (responseText) {
    await sendMessage(env.BOT_TOKEN, chatId, responseText);
  }
}

// === ОБРАБОТКА ОБЫЧНЫХ СООБЩЕНИЙ ===
async function handleUserMessage(message, text, env, chatId, firstName) {
  // RAG поиск
  const ragContext = await ragRetrieve(env, text);
  
  // Запрос к AI
  const userMsg = `[ACTION: USER_REPLY]\nСообщение: ${text}` +
    (ragContext ? `\n\n[RAG_CONTEXT]\n${ragContext}` : "");
  
  const answer = await openRouterComplete(env, SYSTEM_PROMPT, userMsg, "fast");
  
  await sendMessage(env.BOT_TOKEN, chatId, answer);
}
