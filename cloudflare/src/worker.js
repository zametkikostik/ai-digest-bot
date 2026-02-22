/**
 * AI Digest Bot - Self-Learning AI Assistant
 * Поиск в интернете, база знаний, фильтр токсичности
 */
const CHANNEL_ID = "-1001859702206";
const ADMIN_IDS = ["1271633868"];

// Безопасные источники для поиска
const SAFE_SOURCES = [
  "wikipedia.org",
  "arxiv.org",
  "github.com",
  "stackoverflow.com",
  "medium.com",
  "dev.to",
  "habr.com",
  "tproger.ru",
  "vc.ru"
];

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
  "Как заработать на нейросетях"
];

export default {
  async fetch(request, env) {
    try {
      if (request.method === "GET") {
        return new Response("AI Digest Bot 🤖\nСамообучающийся с поиском в интернете");
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

Я — **Aiden**, самообучающийся AI-помощник.

🧠 **Что я умею:**
• Отвечаю на вопросы про ИИ и технологии
• Ищу информацию в интернете
• Запоминаю диалоги
• Фильтрую токсичный контент
• Использую базу знаний

📋 **Команды:**
• /help — справка
• /ask [вопрос] — вопрос с поиском
• /search [запрос] — поиск в базе
• /memory — мои воспоминания
• /clear — очистить память
• /kb — статистика базы
• /post [тема] — пост (admin)
• /train [знание] — добавить знание (admin)

💡 **Просто напиши вопрос** — я найду ответ в интернете!`;
            
          } else if (text === "/help") {
            reply = `📖 **Справка:**

**Основные команды:**
/start — приветствие
/help — эта справка
/ask [вопрос] — вопрос с поиском в интернете
/search [запрос] — поиск в базе знаний
/memory — мои воспоминания
/clear — очистить память
/kb — статистика базы

**Для админов:**
/post [тема] — пост в канал
/train [знание] — добавить в базу

**Примеры:**
• "Что нового в ИИ?"
• "Как работает GPT-4?"
• "Расскажи про трансформеры"

🔍 Я ищу ответы в интернете и фильтрую токсичный контент!`;
            
          } else if (text === "/kb") {
            const keys = await env.RAG_STORE.list();
            const convKeys = await env.CONVERSATION_STORE.list();
            reply = `📊 **Статистика:**

📚 Чанков в базе: ${keys.keys.length}
💭 Диалогов запомнено: ${convKeys.keys.length}

**Источники знаний:**
• Wikipedia, ArXiv, GitHub
• StackOverflow, Medium, Habr
• База знаний бота

**Безопасность:**
✅ Фильтр токсичности
✅ Проверка источников
✅ Модерация контента`;
            
          } else if (text === "/memory") {
            const conv = await getConversation(env, uid);
            if (conv && conv.length > 0) {
              const lastMsgs = conv.slice(-6);
              reply = `💭 **Память**:\n\n`;
              for (let i = lastMsgs.length - 2; i >= 0; i -= 2) {
                const q = lastMsgs[i]?.content || "";
                const a = lastMsgs[i+1]?.content || "";
                if (q && a) {
                  reply += `❓ ${q.slice(0, 80)}...\n`;
                  reply += `💡 ${a.slice(0, 80)}...\n\n`;
                }
              }
              reply += `_Всего: ${conv.length / 2} диалогов_`;
            } else {
              reply = "💭 Память пуста";
            }
            
          } else if (text === "/clear") {
            await env.CONVERSATION_STORE.delete(`conv_${uid}`);
            reply = "🗑️ Память очищена!";
            
          } else if (text === "/ask" || text.startsWith("/ask ")) {
            const question = text.replace("/ask ", "").trim();
            if (!question || question === "/ask") {
              reply = "⚠️ Задайте вопрос!\n\nПример: `/ask Что такое GPT-4?`";
            } else {
              reply = await answerWithSearch(env, uid, question);
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
              
              // Проверка на токсичность
              const toxic = await checkToxicity(env, knowledge);
              if (toxic.isToxic) {
                reply = `⛔ Знание содержит токсичный контент:\n${toxic.reason}`;
              } else {
                const key = `train_${Date.now()}`;
                await env.RAG_STORE.put(key, knowledge);
                reply = `✅ Знание добавлено!\n\n"${knowledge.slice(0, 100)}..."`;
              }
            }
            
          } else if (text.startsWith("/post ")) {
            if (!ADMIN_IDS.includes(uid)) {
              reply = "⛔ Только для администраторов";
            } else {
              const topic = text.replace("/post ", "").trim();
              const post = await generatePost(env, topic);
              const result = await sendMsg(env.BOT_TOKEN, CHANNEL_ID, post);
              reply = result.ok ? "✅ Опубликовано!" : `❌ ${result.description}`;
            }
            
          } else if (text.startsWith("/")) {
            reply = `❓ Неизвестная команда. Используйте /help`;
            
          } else {
            // Обычный вопрос — с поиском в интернете
            reply = await answerWithSearch(env, uid, text);
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
  }
};

// === ФУНКЦИИ ===

// Ответ с поиском в интернете
async function answerWithSearch(env, userId, question) {
  // 1. RAG поиск в базе
  const ragContext = await ragRetrieve(env, question);
  
  // 2. Поиск в интернете (через DuckDuckGo API)
  const webResults = await searchWeb(question);
  
  // 3. Проверка на токсичность вопроса
  const toxicCheck = await checkToxicity(env, question);
  if (toxicCheck.isToxic) {
    return `⛔ Я не могу ответить на этот вопрос.\n\n${toxicCheck.reason}`;
  }
  
  // 4. Формируем контекст
  let context = "";
  if (ragContext) context += `📚 База знаний:\n${ragContext}\n\n`;
  if (webResults) context += `🌐 Интернет:\n${webResults}`;
  
  // 5. Запрос к AI
  const systemMsg = `Ты Aiden — дружелюбный AI-помощник.
Тематика: ИИ, технологии, наука, программирование.
Отвечай на русском языке.
Используй информацию из контекста.
Если не знаешь — честно скажи.
ФИЛЬТРУЙ токсичный контент.
Будь полезен и безопасен.`;

  const userMsg = question + (context ? `\n\nКонтекст:\n${context}` : "");
  
  const answer = await askAI(env, systemMsg, userMsg);
  
  // 6. Финальная проверка на токсичность
  const answerToxic = await checkToxicity(env, answer);
  if (answerToxic.isToxic) {
    return "⛔ Я не могу дать ответ на этот вопрос.";
  }
  
  // 7. Запоминаем диалог
  await saveConversation(env, userId, [
    {role: "user", content: question},
    {role: "assistant", content: answer}
  ]);
  
  return answer;
}

// Поиск в интернете (через DuckDuckGo)
async function searchWeb(query) {
  try {
    // Используем DuckDuckGo Instant Answer API (бесплатно)
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    let results = "";
    
    // Abstract (основной ответ)
    if (data.AbstractText) {
      results += `${data.AbstractText}\n`;
      if (data.AbstractURL) {
        results += `Источник: ${data.AbstractURL}\n`;
      }
    }
    
    // Related topics
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      const topics = data.RelatedTopics.slice(0, 3);
      for (const topic of topics) {
        if (topic.Text) {
          results += `• ${topic.Text}\n`;
        }
      }
    }
    
    // Проверка на безопасные источники
    if (results) {
      const isSafe = SAFE_SOURCES.some(source => 
        results.toLowerCase().includes(source) || !results.includes('http')
      );
      
      if (!isSafe) {
        return "🔍 Нашёл информацию, но источники требуют проверки.";
      }
    }
    
    return results || "🔍 Не нашёл информации в открытых источниках.";
    
  } catch (e) {
    console.error("Web search error:", e);
    return "🔍 Не удалось найти информацию в интернете.";
  }
}

// Проверка на токсичность
async function checkToxicity(env, text) {
  try {
    // Используем AI для проверки
    const systemMsg = `Ты модератор контента.
Проверь текст на:
- Оскорбления и угрозы
- Мат и нецензурную лексику
- Разжигание ненависти
- Опасный контент (насилие, суицид)
- Токсичность и агрессию

Верни JSON:
{"isToxic": true/false, "reason": "причина если токсично"}
Только JSON, без пояснений.`;

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
          {role: "system", content: systemMsg},
          {role: "user", content: `Проверь текст:\n${text.slice(0, 500)}`}
        ],
        max_tokens: 100,
        temperature: 0.1
      })
    });
    
    const d = await r.json();
    const response = d.choices?.[0]?.message?.content || '{"isToxic": false}';
    
    try {
      const cleaned = response.replace(/```json/g, "").replace(/```/g, "").trim();
      const result = JSON.parse(cleaned);
      return {
        isToxic: result.isToxic || false,
        reason: result.reason || ""
      };
    } catch {
      return {isToxic: false, reason: ""};
    }
    
  } catch (e) {
    console.error("Toxicity check error:", e);
    return {isToxic: false, reason: ""};
  }
}

// RAG поиск
async function ragRetrieve(env, query, topK = 3) {
  try {
    const keys = await env.RAG_STORE.list();
    const results = [];
    const queryLower = query.toLowerCase().slice(0, 30);
    
    for (const key of keys.keys) {
      const value = await env.RAG_STORE.get(key.name);
      if (value && value.toLowerCase().includes(queryLower)) {
        results.push(value);
        if (results.length >= topK) break;
      }
    }
    
    return results.length > 0 
      ? results.join("\n\n---\n\n") 
      : "";
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
          {role:"system",content:"Создай пост для Telegram. Заголовок с эмодзи, текст 500-800 символов, 3-5 хэштегов, призыв к действию."},
          {role:"user",content:"Тема: "+topic}
        ],
        max_tokens: 1000
      })
    });
    
    const d = await r.json();
    return d.choices?.[0]?.message?.content || `📝 ${topic}\n\n#AI`;
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
