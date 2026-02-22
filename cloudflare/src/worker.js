/**
 * Telegram Bot Worker для Cloudflare Workers
 * Обработка webhook запросов
 */

// === КОНСТАНТЫ ===
const MODELS = {
  heavy: "qwen/qwen3-235b-a22b:free",
  reason: "deepseek/deepseek-r1:free",
  fast: "mistralai/mistral-7b-instruct:free",
};

const SYSTEM_PROMPT = `
# РОЛЬ
Ты — AI-ассистент Telegram-канала "AI-дайджест".
Тематика: Всё об искусственном интеллекте за неделю. Новости, инструменты, лайфхаки.

# РЕЖИМЫ
- [ACTION: CREATE_POST] — создание поста для канала
- [ACTION: USER_REPLY] — ответ пользователю
- [ACTION: MODERATE] — модерация (верни JSON: {"action":"allow|warn|delete|ban","reason":"...","confidence":0.5})

# ПРАВИЛА
- Отвечай на русском
- Используй RAG_CONTEXT если есть
- При модерации возвращай ТОЛЬКО JSON
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

async function openRouterCompleteJSON(env, system, user, mode = "reason") {
  const text = await openRouterComplete(env, system, user, mode);
  try {
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { action: "allow", reason: "Parse error", confidence: 0.5 };
  }
}

// === RAG (упрощённый, на KV) ===
async function ragRetrieve(env, query, topK = 3) {
  const embedding = await getEmbedding(query);
  const keys = await env.RAG_STORE.list();
  
  // Упрощённый поиск по ключам (для production нужен векторный поиск)
  const results = [];
  for (const key of keys.keys.slice(0, topK)) {
    const value = await env.RAG_STORE.get(key.name);
    if (value) results.push(value);
  }
  
  return results.join("\n\n---\n\n");
}

async function ragAddDocument(env, text, source, id) {
  // Разбиение на чанки
  const chunks = chunkText(text, 512, 64);
  for (let i = 0; i < chunks.length; i++) {
    await env.RAG_STORE.put(`chunk_${id}_${i}`, chunks[i]);
  }
  return chunks.length;
}

function chunkText(text, size = 512, overlap = 64) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + size;
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > start + size / 2) end = lastSpace;
    }
    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }
  return chunks;
}

// === Embeddings (через API) ===
async function getEmbedding(text) {
  // Используем бесплатное API для эмбеддингов
  // Для production лучше использовать локальную модель через Workers AI
  const response = await fetch("https://api.all-minilm.ai/embed", {
    method: "POST",
    body: JSON.stringify({ text })
  }).catch(() => null);
  
  if (response?.ok) {
    const data = await response.json();
    return data.embedding;
  }
  
  // Fallback: хэш текста
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash));
}

// === МОДЕРАЦИЯ ===
const SPAM_PATTERNS = [
  /https?:\/\/\S+/i,
  /@[a-zA-Z0-9_]{5,}/,
  /(заработ|казино|крипто|инвест).{0,30}(денег|прибыль)/i,
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
async function handleWebhook(request, env, ctx) {
  const update = await request.json();
  
  // Сообщение от пользователя
  if (update.message) {
    const message = update.message;
    const userId = message.from.id;
    const text = message.text || "";
    
    // Проверка бана
    const user = await env.DB.prepare(
      "SELECT * FROM users WHERE telegram_id = ?"
    ).bind(userId).first();
    
    if (user?.is_banned) {
      return Response.json({ ok: true });
    }
    
    // Обработка команд
    if (text.startsWith("/")) {
      return await handleCommand(message, text, env, userId);
    }
    
    // Обычное сообщение — AI ответ
    return await handleUserMessage(message, text, env, userId);
  }
  
  // Inline query
  if (update.inline_query) {
    return await handleInlineQuery(update.inline_query, env);
  }
  
  return Response.json({ ok: true });
}

async function handleCommand(message, text, env, userId) {
  const chatId = message.chat.id;
  const parts = text.split(" ");
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(" ");
  
  switch (command) {
    case "/start":
      await sendMessage(env.BOT_TOKEN, chatId, 
        `👋 Привет, ${message.from.first_name}!\n\n` +
        `Я — AI-дайджест, твой помощник по миру ИИ.\n\n` +
        "Команды:\n" +
        "• /help — справка\n" +
        "• /ask [вопрос] — вопрос AI\n" +
        "• /search [запрос] — поиск в БЗ\n" +
        "• /rules — правила"
      );
      break;
      
    case "/help":
      await sendMessage(env.BOT_TOKEN, chatId,
        "📖 **Справка**:\n\n" +
        "/ask [вопрос] — задать вопрос AI\n" +
        "/search [запрос] — поиск в базе\n" +
        "/rules — правила чата\n" +
        "/generate [тема] — создать пост (admin)"
      );
      break;
      
    case "/ask":
      if (!args) {
        await sendMessage(env.BOT_TOKEN, chatId, "⚠️ Задайте вопрос: /ask [текст]");
        break;
      }
      
      const ragContext = await ragRetrieve(env, args);
      const userMsg = `[ACTION: USER_REPLY]\n${args}` + 
        (ragContext ? `\n\n[RAG_CONTEXT]\n${ragContext}` : "");
      
      const response = await openRouterComplete(env, SYSTEM_PROMPT, userMsg, "fast");
      await sendMessage(env.BOT_TOKEN, chatId, response);
      break;
      
    case "/generate":
      if (!env.ADMIN_IDS.split(",").includes(String(userId))) {
        await sendMessage(env.BOT_TOKEN, chatId, "⛔ Только для админов");
        break;
      }
      
      if (!args) {
        await sendMessage(env.BOT_TOKEN, chatId, "⚠️ Укажите тему: /generate [тема]");
        break;
      }
      
      const postRag = await ragRetrieve(env, args);
      const postMsg = `[ACTION: CREATE_POST]\nТема: ${args}` +
        (postRag ? `\n\n[RAG_CONTEXT]\n${postRag}` : "");
      
      const post = await openRouterComplete(env, SYSTEM_PROMPT, postMsg, "heavy");
      await sendMessage(env.BOT_TOKEN, chatId, `📝 Предпросмотр:\n\n${post}`);
      
      // Сохранение в очередь
      await env.DB.prepare(
        "INSERT INTO posts (topic, content, status) VALUES (?, ?, 'pending')"
      ).bind(args, post).run();
      break;
      
    case "/rules":
      await sendMessage(env.BOT_TOKEN, chatId,
        "📜 **Правила**:\n\n" +
        "1. Уважайте участников\n" +
        "2. Без спама и рекламы\n" +
        "3. Без оскорблений\n" +
        "4. Без NSFW\n" +
        "5. Без персональных данных"
      );
      break;
      
    case "/search":
      if (!args) {
        await sendMessage(env.BOT_TOKEN, chatId, "⚠️ Введите запрос: /search [запрос]");
        break;
      }
      
      const results = await ragRetrieve(env, args, 5);
      await sendMessage(env.BOT_TOKEN, chatId, 
        results || "🔍 Ничего не найдено"
      );
      break;
      
    default:
      await sendMessage(env.BOT_TOKEN, chatId, "❓ Неизвестная команда. Используйте /help");
  }
  
  return Response.json({ ok: true });
}

async function handleUserMessage(message, text, env, userId) {
  const chatId = message.chat.id;
  
  // Быстрая модерация
  const quickMod = quickModerate(text);
  if (quickMod && quickMod.action === "delete") {
    await deleteMessage(env.BOT_TOKEN, chatId, message.message_id);
    return Response.json({ ok: true });
  }
  
  // AI модерация
  const modResult = await openRouterCompleteJSON(
    env, 
    SYSTEM_PROMPT, 
    `[ACTION: MODERATE]\n${text}`,
    "reason"
  );
  
  if (modResult.action === "delete") {
    await deleteMessage(env.BOT_TOKEN, chatId, message.message_id);
    await logViolation(env, userId, "delete", modResult.reason, text);
  } else if (modResult.action === "warn") {
    await sendMessage(env.BOT_TOKEN, chatId, `⚠️ Предупреждение: ${modResult.reason}`);
    await logViolation(env, userId, "warn", modResult.reason, text);
  } else if (modResult.action === "ban") {
    await env.DB.prepare(
      "UPDATE users SET is_banned = TRUE WHERE telegram_id = ?"
    ).bind(userId).run();
    await deleteMessage(env.BOT_TOKEN, chatId, message.message_id);
  }
  
  // AI ответ
  const ragContext = await ragRetrieve(env, text);
  const userMsg = `[ACTION: USER_REPLY]\n${text}` +
    (ragContext ? `\n\n[RAG_CONTEXT]\n${ragContext}` : "");
  
  const response = await openRouterComplete(env, SYSTEM_PROMPT, userMsg, "fast");
  await sendMessage(env.BOT_TOKEN, chatId, response);
  
  return Response.json({ ok: true });
}

async function handleInlineQuery(inlineQuery, env) {
  const { id, query, from } = inlineQuery;
  
  if (!query) {
    await answerInlineQuery(env.BOT_TOKEN, id, []);
    return Response.json({ ok: true });
  }
  
  const results = await ragRetrieve(env, query, 5);
  
  const inlineResults = [{
    type: "article",
    id: "1",
    title: "Результат поиска",
    description: query,
    input_message_content: {
      message_text: results || "Ничего не найдено"
    }
  }];
  
  await answerInlineQuery(env.BOT_TOKEN, id, inlineResults);
  return Response.json({ ok: true });
}

// === TELEGRAM API ===
async function sendMessage(token, chatId, text, parseMode = "Markdown") {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode })
  });
}

async function deleteMessage(token, chatId, messageId) {
  const url = `https://api.telegram.org/bot${token}/deleteMessage`;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId })
  });
}

async function answerInlineQuery(token, queryId, results) {
  const url = `https://api.telegram.org/bot${token}/answerInlineQuery`;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inline_query_id: queryId, results })
  });
}

async function setWebhook(token, webhookUrl) {
  const url = `https://api.telegram.org/bot${token}/setWebhook`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message", "inline_query"] })
  });
  return response.json();
}

// === УТИЛИТЫ ===
async function logViolation(env, telegramId, action, reason, messageText) {
  await env.DB.prepare(`
    INSERT INTO violations (telegram_id, action, reason, message_text)
    VALUES (?, ?, ?, ?)
  `).bind(telegramId, action, reason, messageText?.slice(0, 2000)).run();
}

// === CRON (планировщик) ===
async function handleScheduled(ctx, env) {
  // Постинг по расписанию
  const posts = await env.DB.prepare(
    "SELECT * FROM posts WHERE status = 'pending' ORDER BY priority DESC LIMIT 3"
  ).all();
  
  for (const post of posts.results || []) {
    try {
      await sendMessage(env.BOT_TOKEN, env.CHANNEL_ID, post.content);
      await env.DB.prepare(
        "UPDATE posts SET status = 'published', published_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(post.id).run();
    } catch (e) {
      await env.DB.prepare(
        "UPDATE posts SET status = 'failed', error_message = ? WHERE id = ?"
      ).bind(e.message, post.id).run();
    }
  }
}

// === ЭКСПОРТ ===
export default {
  async fetch(request, env, ctx) {
    // Webhook от Telegram
    if (request.method === "POST") {
      return handleWebhook(request, env, ctx);
    }
    
    // Health check
    if (request.method === "GET") {
      return new Response("AI Digest Bot is running", { 
        headers: { "Content-Type": "text/plain" } 
      });
    }
    
    return new Response("Method not allowed", { status: 405 });
  },
  
  async scheduled(event, env, ctx) {
    await handleScheduled(ctx, env);
  }
};
