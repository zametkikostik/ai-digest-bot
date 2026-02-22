/**
 * AI Digest Bot - Self-Learning AI Assistant
 * Запоминает диалоги, учится на ответах, использует базу знаний
 */
const CHANNEL_ID = "-1001859702206";
const ADMIN_IDS = ["1271633868"];

// Темы для автопостинга
const AUTO_TOPICS = [
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

export default {
  async fetch(request, env) {
    try {
      if (request.method === "GET") {
        return new Response("AI Digest Bot 🤖\nСамообучающийся AI-помощник");
      }
      
      if (request.method === "POST") {
        const update = await request.json();
        
        if (update.message) {
          const msg = update.message;
          const chatId = msg.chat.id;
          const text = msg.text || "";
          const name = msg.from?.first_name || "User";
          const uid = msg.from?.id?.toString();
          const chatType = msg.chat.type;
          
          // Пропускаем группы
          if (chatType === "group" || chatType === "supergroup") {
            return new Response("OK");
          }
          
          let reply = "";
          
          // === КОМАНДЫ ===
          if (text === "/start") {
            reply = `👋 Привет, ${name}!

Я — **Aiden**, твой самообучающийся AI-помощник.

🧠 **Что я умею:**
• Отвечаю на вопросы про ИИ и технологии
• Запоминаю наши диалоги
• Учусь на новых вопросах
• Использую базу знаний
• Создаю посты для Telegram

📋 **Команды:**
• /help — справка
• /ask [вопрос] — вопрос с поиском в базе
• /search [запрос] — поиск в базе
• /kb — статистика базы знаний
• /memory — моя память (диалоги)
• /clear — очистить память
• /post [тема] — пост в канал (admin)
• /train — добавить знание (admin)

💡 **Просто напиши вопрос** — я отвечу и запомню!`;
            
          } else if (text === "/help") {
            reply = `📖 **Справка:**

**Основные команды:**
/start — приветствие
/help — эта справка
/ask [вопрос] — вопрос AI с поиском в базе
/search [запрос] — поиск в базе
/memory — мои воспоминания
/clear — очистить память

**Для админов:**
/post [тема] — пост в канал
/train [знание] — добавить в базу
/kb — статистика базы

**Примеры вопросов:**
• "Что такое трансформер?"
• "Как работает GPT-4?"
• "Расскажи про машинное обучение"
• "Какие есть AI для кода?"

💡 Я запоминаю диалоги и становлюсь умнее!`;
            
          } else if (text === "/kb") {
            const keys = await env.RAG_STORE.list();
            const convKeys = await env.CONVERSATION_STORE.list();
            reply = `📊 **База знаний:**

📚 Чанков в базе: ${keys.keys.length}
💭 Запомнено диалогов: ${convKeys.keys.length}

Чтобы добавить знания:
/train [текст знания]`;
            
          } else if (text === "/memory") {
            const conv = await getConversation(env, uid);
            if (conv && conv.length > 0) {
              const lastMsgs = conv.slice(-6); // Последние 3 диалога
              reply = `💭 **Память диалогов**:\n\n`;
              for (let i = lastMsgs.length - 1; i >= 0; i -= 2) {
                const q = lastMsgs[i]?.content || "";
                const a = lastMsgs[i+1]?.content || "";
                if (q && a) {
                  reply += `❓ ${q.slice(0, 100)}...\n`;
                  reply += `💡 ${a.slice(0, 100)}...\n\n`;
                }
              }
              reply += `_Всего диалогов: ${conv.length / 2}_`;
            } else {
              reply = "💭 Память пуста. Напиши мне что-нибудь!";
            }
            
          } else if (text === "/clear") {
            await env.CONVERSATION_STORE.delete(`conv_${uid}`);
            reply = "🗑️ Память диалогов очищена!";
            
          } else if (text === "/ask" || text.startsWith("/ask ")) {
            const question = text.replace("/ask ", "").trim();
            if (!question || question === "/ask") {
              reply = "⚠️ Задайте вопрос!\n\nПример: `/ask Что такое GPT?`";
            } else {
              reply = await answerQuestion(env, uid, question, true);
            }
            
          } else if (text.startsWith("/search ")) {
            const query = text.replace("/search ", "").trim();
            const results = await ragRetrieve(env, query, 5);
            reply = results 
              ? `🔍 **Результаты**:\n\n${results}`
              : "🔍 Ничего не найдено";
            
          } else if (text.startsWith("/train ")) {
            if (!ADMIN_IDS.includes(uid)) {
              reply = "⛔ Только для администраторов";
            } else {
              const knowledge = text.replace("/train ", "").trim();
              const key = `train_${Date.now()}`;
              await env.RAG_STORE.put(key, knowledge);
              reply = `✅ Знание добавлено в базу!\n\n"${knowledge.slice(0, 100)}..."`;
            }
            
          } else if (text.startsWith("/post ")) {
            if (!ADMIN_IDS.includes(uid)) {
              reply = "⛔ Только для администраторов";
            } else {
              const topic = text.replace("/post ", "").trim();
              const post = await generatePost(env, topic);
              const result = await sendMsg(env.BOT_TOKEN, CHANNEL_ID, post);
              reply = result.ok ? "✅ Опубликовано в ai_world_russia!" : `❌ ${result.description}`;
            }
            
          } else if (text.startsWith("/")) {
            reply = `❓ Неизвестная команда. Используйте /help`;
            
          } else {
            // Обычный вопрос — отвечаем и запоминаем
            reply = await answerQuestion(env, uid, text, false);
          }
          
          if (reply) {
            await sendMsg(env.BOT_TOKEN, chatId, reply);
          }
        }
        
        return new Response("OK");
        
      }
      
      return new Response("No");
      
    } catch (e) {
      console.error("Error:", e);
      return new Response("Error: " + e.message, {status: 500});
    }
  },
  
  // Автопостинг
  async scheduled(event, env) {
    const topic = AUTO_TOPICS[Math.floor(Math.random() * AUTO_TOPICS.length)];
    const post = await generatePost(env, topic);
    await sendMsg(env.BOT_TOKEN, CHANNEL_ID, post);
    console.log(`Auto-posted: ${topic}`);
  }
};

// === ФУНКЦИИ ===

// Ответ на вопрос с обучением
async function answerQuestion(env, userId, question, isCommand) {
  // RAG поиск
  const ragContext = await ragRetrieve(env, question);
  
  // Получаем контекст диалога
  const conversation = await getConversation(env, userId);
  const contextMsg = conversation 
    ? `Предыдущие сообщения: ${conversation.slice(-4).map(m => m.content).join(' | ')}`
    : "";
  
  // Системный промпт
  const systemMsg = `Ты Aiden — самообучающийся AI-помощник.
Тематика: ИИ, технологии, нейросети, программирование.
Отвечай на русском языке.
Используй базу знаний если есть контекст.
Будь дружелюбен, краток но информативен.
Если не знаешь — честно скажи и предложи альтернативу.
${contextMsg ? '\n' + contextMsg : ''}`;

  // Запрос к AI
  const userMsg = question + (ragContext ? `\n\nКонтекст из базы знаний:\n${ragContext}` : "");
  
  const answer = await askAI(env, systemMsg, userMsg);
  
  // Запоминаем диалог
  await saveConversation(env, userId, [
    {role: "user", content: question},
    {role: "assistant", content: answer}
  ]);
  
  return answer;
}

// RAG поиск
async function ragRetrieve(env, query, topK = 3) {
  try {
    const keys = await env.RAG_STORE.list();
    const results = [];
    const queryLower = query.toLowerCase().slice(0, 30);
    
    // Поиск по совпадению ключевых слов
    for (const key of keys.keys) {
      const value = await env.RAG_STORE.get(key.name);
      if (value && value.toLowerCase().includes(queryLower)) {
        results.push({key: key.name, value, score: 1});
      }
    }
    
    // Сортируем и берём топ
    results.sort((a, b) => b.score - a.score);
    const top = results.slice(0, topK).map(r => r.value);
    
    if (top.length > 0) {
      return "📚 Из базы знаний:\n\n" + top.join("\n\n---\n\n");
    }
    
    return "";
  } catch (e) {
    console.error("RAG error:", e);
    return "";
  }
}

// Получение диалога
async function getConversation(env, userId) {
  try {
    const data = await env.CONVERSATION_STORE.get(`conv_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Сохранение диалога
async function saveConversation(env, userId, messages, maxMessages = 20) {
  try {
    let conv = await getConversation(env, userId);
    conv = conv.concat(messages);
    
    // Ограничиваем размер
    if (conv.length > maxMessages) {
      conv = conv.slice(-maxMessages);
    }
    
    await env.CONVERSATION_STORE.put(`conv_${userId}`, JSON.stringify(conv));
  } catch (e) {
    console.error("Save conversation error:", e);
  }
}

// AI запрос
async function askAI(env, system, user) {
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.OPENROUTER_API_KEY,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-bot.com",
        "X-Title": "AidenBot"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          {role: "system", content: system},
          {role: "user", content: user}
        ],
        max_tokens: 800
      })
    });
    
    if (!r.ok) throw new Error(`API error: ${r.status}`);
    
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "Не могу ответить сейчас";
  } catch(e) {
    return "Ошибка подключения к AI: " + e.message;
  }
}

// Генерация поста
async function generatePost(env, topic) {
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.OPENROUTER_API_KEY,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-bot.com",
        "X-Title": "AidenBot"
      },
      body: JSON.stringify({
        model: "qwen/qwen3-235b-a22b:free",
        messages: [
          {role:"system",content:"Создай пост для Telegram канала про ИИ. Заголовок с эмодзи, текст 500-800 символов, 3-5 хэштегов, призыв к действию."},
          {role:"user",content:"Тема: "+topic}
        ],
        max_tokens: 1000
      })
    });
    
    const d = await r.json();
    return d.choices?.[0]?.message?.content || `📝 ${topic}\n\n#AI #News`;
  } catch(e) {
    return `📝 ${topic}\n\n#AI`;
  }
}

// Отправка сообщения
function sendMsg(token, chatId, text) {
  return fetch("https://api.telegram.org/bot"+token+"/sendMessage", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown"
    })
  }).then(r => r.json());
}
