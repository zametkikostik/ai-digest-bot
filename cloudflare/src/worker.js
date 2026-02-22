/**
 * AI Digest Bot - Full AI Assistant
 * С RAG поиском по базе знаний
 */
const CHANNEL_ID = "-1001859702206";
const ADMIN_IDS = ["1271633868"];

export default {
  async fetch(request, env) {
    try {
      if (request.method === "GET") {
        return new Response("AI Digest Bot 🤖\nПолноценный AI-помощник");
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
          
          // Пропускаем группы для простоты
          if (chatType === "group" || chatType === "supergroup") {
            return new Response("OK");
          }
          
          let reply = "";
          
          if (text === "/start") {
            reply = `👋 Привет, ${name}!

Я — **AI-помощник Aiden**.

📚 **Что я умею:**
• Отвечаю на вопросы про ИИ и технологии
• Помогаю с кодом и нейросетями
• Создаю посты для Telegram
• Использую базу знаний для точных ответов

📋 **Команды:**
• /help — справка
• /ask [вопрос] — вопрос с поиском в базе
• /post [тема] — пост в канал (admin)
• /kb — статистика базы знаний

💡 **Просто напиши вопрос** — я отвечу!`;
            
          } else if (text === "/help") {
            reply = `📖 **Справка:**

**Команды:**
/start — приветствие
/help — эта справка
/ask [вопрос] — вопрос AI с поиском в базе
/search [запрос] — поиск в базе знаний
/post [тема] — пост в канал (admin)
/kb — статистика базы

**Примеры вопросов:**
• "Что такое трансформер?"
• "Как работает GPT?"
• "Расскажи про машинное обучение"

💡 Я использую базу знаний для точных ответов!`;
            
          } else if (text === "/kb") {
            const keys = await env.RAG_STORE.list();
            reply = `📊 **База знаний:**

📚 Чанков: ${keys.keys.length}
📁 Файлов: ~${Math.ceil(keys.keys.length / 5)}

Чтобы добавить знания:
1. Создайте .txt файл в knowledge_base/docs/
2. Запустите load_knowledge.py`;
            
          } else if (text === "/ask" || text.startsWith("/ask ")) {
            const question = text.replace("/ask ", "").trim();
            if (!question || question === "/ask") {
              reply = "⚠️ Задайте вопрос!\n\nПример: `/ask Что такое GPT?`";
            } else {
              // RAG поиск
              const ragContext = await ragRetrieve(env, question);
              
              // Запрос к AI
              const systemMsg = `Ты AI-помощник. Отвечай на русском языке.
Используй контекст из базы знаний если есть.
Если не знаешь — честно скажи.
Будь краток но информативен.`;
              
              const userMsg = question + (ragContext ? `\n\nКонтекст:\n${ragContext}` : "");
              
              const answer = await askAI(env, systemMsg, userMsg);
              reply = `🤖 **Ответ**:\n\n${answer}`;
            }
            
          } else if (text.startsWith("/search ")) {
            const query = text.replace("/search ", "").trim();
            const results = await ragRetrieve(env, query, 5);
            reply = results 
              ? `🔍 **Результаты**:\n\n${results}`
              : "🔍 Ничего не найдено";
            
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
            // Обычный вопрос — используем RAG + AI
            const ragContext = await ragRetrieve(env, text);
            
            const systemMsg = `Ты дружелюбный AI-помощник Aiden.
Отвечай на русском языке.
Используй контекст если есть.
Будь краток но полезен.`;
            
            const userMsg = text + (ragContext ? `\n\nКонтекст из базы:\n${ragContext}` : "");
            
            const answer = await askAI(env, systemMsg, userMsg);
            reply = answer;
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
  
  // Автопостинг по расписанию
  async scheduled(event, env) {
    const topics = [
      "Новости ИИ за неделю",
      "Новые AI инструменты",
      "Как нейросети меняют мир",
      "Обзор GPT-4 vs Claude",
      "AI для разработчиков"
    ];
    
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const post = await generatePost(env, topic);
    await sendMsg(env.BOT_TOKEN, CHANNEL_ID, post);
    console.log(`Posted: ${topic}`);
  }
};

// RAG поиск по KV хранилищу
async function ragRetrieve(env, query, topK = 3) {
  try {
    const keys = await env.RAG_STORE.list();
    const results = [];
    
    // Простой поиск по ключам (для production нужен векторный)
    for (const key of keys.keys.slice(0, topK * 2)) {
      const value = await env.RAG_STORE.get(key.name);
      if (value && value.toLowerCase().includes(query.toLowerCase().slice(0, 20))) {
        results.push(value);
        if (results.length >= topK) break;
      }
    }
    
    // Если не нашли по совпадению — возвращаем первые чанки
    if (results.length === 0) {
      for (const key of keys.keys.slice(0, topK)) {
        const value = await env.RAG_STORE.get(key.name);
        if (value) results.push(value);
      }
    }
    
    return results.join("\n\n---\n\n");
  } catch (e) {
    console.error("RAG error:", e);
    return "";
  }
}

// AI запрос к OpenRouter
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
          {role:"system",content:"Создай пост для Telegram канала про ИИ. Формат: заголовок с эмодзи, текст 500-800 символов, 3-5 хэштегов, призыв к действию в конце."},
          {role:"user",content:"Тема: "+topic}
        ],
        max_tokens: 1000
      })
    });
    
    const d = await r.json();
    return d.choices?.[0]?.message?.content || `📝 Пост на тему: ${topic}\n\n#AI #News`;
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
