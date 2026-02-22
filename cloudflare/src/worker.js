/**
 * AI Digest Bot - AI Assistant with Coding Skills
 * Программирование, поиск в интернете, база знаний
 */
const CHANNEL_ID = "-1001859702206";
const ADMIN_IDS = ["1271633868"];

// Темы для автопостинга
const AUTO_TOPICS = [
  "Последние новости ИИ за неделю",
  "Новые AI инструменты для разработчиков",
  "Как нейросети меняют работу программистов",
  "Обзор GPT-4 vs Claude для кода",
  "AI для автоматизации разработки",
  "Топ-10 AI библиотек 2026",
  "GitHub Copilot vs Codeium",
  "AI генерация кода: возможности",
  "Как AI помогает в отладке",
  "Будущее программирования с ИИ"
];

export default {
  async fetch(request, env) {
    try {
      if (request.method === "GET") {
        return new Response("AI Digest Bot 🤖\nПомощник программиста");
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
          
          if (chatType === "group" || chatType === "supergroup") {
            return new Response("OK");
          }
          
          let reply = "";
          
          if (text === "/start") {
            reply = `👋 Привет, ${name}!

Я — **Aiden**, AI-помощник для программистов.

💻 **Что я умею:**
• Пишу код на Python, JS, TypeScript, Go и др.
• Помогаю с отладкой и ошибками
• Объясняю концепции программирования
• Ищу решения в интернете
• Создаю посты про технологии

📋 **Команды:**
• /help — справка
• /code [задача] — написать код
• /debug [код] — найти ошибку
• /explain [концепция] — объяснить
• /ask [вопрос] — вопрос с поиском
• /memory — мои диалоги
• /kb — статистика базы

💡 **Примеры:**
• "Напиши функцию на Python для сортировки"
• "Объясни что такое асинхронность"
• "Найди ошибку в коде: ..."

🔍 Я ищу решения в интернете и пишу чистый код!`;
            
          } else if (text === "/help") {
            reply = `📖 **Справка:**

**Для программистов:**
/code [задача] — написать код
/debug [код] — найти ошибку
/explain [концепция] — объяснить
/refactor [код] — улучшить код

**Общие:**
/start — приветствие
/ask [вопрос] — вопрос с поиском
/search [запрос] — поиск в базе
/memory — диалоги
/kb — статистика

**Примеры задач:**
• "Напиши REST API на FastAPI"
• "Создай React компонент"
• "Объясни паттерн Observer"
• "Найди ошибку: ..."

💻 Я знаю Python, JavaScript, TypeScript, Go, Rust, Java и др.!`;
            
          } else if (text === "/kb") {
            const keys = await env.RAG_STORE.list();
            reply = `📊 **База знаний:**

📚 Чанков: ${keys.keys.length}
💻 Про программирование: ~${Math.floor(keys.keys.length * 0.6)}

**Языки:**
Python, JavaScript, TypeScript, Go, Rust, Java, C++

**Технологии:**
React, Node.js, FastAPI, Docker, Kubernetes, AI/ML`;
            
          } else if (text === "/memory") {
            const conv = await getConversation(env, uid);
            if (conv && conv.length > 0) {
              const last = conv.slice(-6);
              reply = `💭 **Диалоги**:\n\n`;
              for (let i = last.length - 2; i >= 0; i -= 2) {
                const q = last[i]?.content || "";
                const a = last[i+1]?.content || "";
                reply += `❓ ${q.slice(0, 60)}...\n`;
                reply += `💡 ${a.slice(0, 60)}...\n\n`;
              }
            } else {
              reply = "💭 Память пуста";
            }
            
          } else if (text === "/code" || text.startsWith("/code ")) {
            const task = text.replace("/code ", "").trim();
            if (!task || task === "/code") {
              reply = "⚠️ Опишите задачу!\n\nПример: `/code Напиши функцию на Python для сортировки списка`";
            } else {
              reply = await writeCode(env, uid, task);
            }
            
          } else if (text === "/debug" || text.startsWith("/debug ")) {
            const code = text.replace("/debug ", "").trim();
            if (!code || code === "/debug") {
              reply = "⚠️ Вставьте код!\n\nПример: `/debug def foo(): return x`";
            } else {
              reply = await debugCode(env, uid, code);
            }
            
          } else if (text === "/explain" || text.startsWith("/explain ")) {
            const concept = text.replace("/explain ", "").trim();
            if (!concept || concept === "/explain") {
              reply = "⚠️ Что объяснить?\n\nПример: `/explain асинхронность в JavaScript`";
            } else {
              reply = await explainConcept(env, uid, concept);
            }
            
          } else if (text === "/refactor" || text.startsWith("/refactor ")) {
            const code = text.replace("/refactor ", "").trim();
            if (!code || code === "/refactor") {
              reply = "⚠️ Вставьте код!\n\nПример: `/refactor def foo(x): return x+1`";
            } else {
              reply = await refactorCode(env, uid, code);
            }
            
          } else if (text === "/ask" || text.startsWith("/ask ")) {
            const question = text.replace("/ask ", "").trim();
            if (!question || question === "/ask") {
              reply = "⚠️ Задайте вопрос!\n\nПример: `/ask Что такое трансформер?`";
            } else {
              reply = await answerWithSearch(env, uid, question);
            }
            
          } else if (text.startsWith("/search ")) {
            const query = text.replace("/search ", "").trim();
            const results = await ragRetrieve(env, query, 5);
            reply = results ? `🔍 **Результаты**:\n\n${results}` : "🔍 Ничего не найдено";
            
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
            // Обычный вопрос — определяем тип
            if (looksLikeCode(text)) {
              reply = await debugCode(env, uid, text);
            } else if (looksLikeConcept(text)) {
              reply = await explainConcept(env, uid, text);
            } else {
              reply = await answerWithSearch(env, uid, text);
            }
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
  
  async scheduled(event, env) {
    const topic = AUTO_TOPICS[Math.floor(Math.random() * AUTO_TOPICS.length)];
    const post = await generatePost(env, topic);
    await sendMsg(env.BOT_TOKEN, CHANNEL_ID, post);
  }
};

// === ФУНКЦИИ ===

// Написание кода
async function writeCode(env, userId, task) {
  const systemMsg = `Ты опытный программист.
Напиши чистый, рабочий код для задачи.
Добавь комментарии на русском.
Укажи как использовать.
Форматируй код в markdown блоках.`;

  const answer = await askAI(env, systemMsg, `Задача: ${task}`);
  await saveConversation(env, userId, [
    {role: "user", content: `Code: ${task}`},
    {role: "assistant", content: answer}
  ]);
  return `💻 **Код**:\n\n${answer}`;
}

// Отладка кода
async function debugCode(env, userId, code) {
  const systemMsg = `Ты эксперт по отладке кода.
Найди ошибки в коде.
Объясни что не так.
Предложи исправленную версию.
Форматируй в markdown.`;

  const answer = await askAI(env, systemMsg, `Найди ошибку:\n\`\`\`\n${code}\n\`\`\``);
  await saveConversation(env, userId, [
    {role: "user", content: `Debug: ${code.slice(0, 200)}`},
    {role: "assistant", content: answer}
  ]);
  return `🔧 **Отладка**:\n\n${answer}`;
}

// Объяснение концепции
async function explainConcept(env, userId, concept) {
  const systemMsg = `Ты учитель программирования.
Объясни концепцию просто и понятно.
Приведи примеры кода.
Используй аналогии из жизни.
Форматируй в markdown.`;

  const answer = await askAI(env, systemMsg, `Объясни: ${concept}`);
  await saveConversation(env, userId, [
    {role: "user", content: `Explain: ${concept}`},
    {role: "assistant", content: answer}
  ]);
  return `📚 **Объяснение**:\n\n${answer}`;
}

// Рефакторинг кода
async function refactorCode(env, userId, code) {
  const systemMsg = `Ты эксперт по рефакторингу.
Улучши код: сделай чище, быстрее, читаемее.
Объясни что изменил.
Сохрани функциональность.
Форматируй в markdown.`;

  const answer = await askAI(env, systemMsg, `Улучши код:\n\`\`\`\n${code}\n\`\`\``);
  await saveConversation(env, userId, [
    {role: "user", content: `Refactor: ${code.slice(0, 200)}`},
    {role: "assistant", content: answer}
  ]);
  return `✨ **Рефакторинг**:\n\n${answer}`;
}

// Ответ с поиском
async function answerWithSearch(env, userId, question) {
  const ragContext = await ragRetrieve(env, question);
  const webResults = await searchWeb(question);
  
  let context = "";
  if (ragContext) context += `📚 База:\n${ragContext}\n\n`;
  if (webResults) context += `🌐 Интернет:\n${webResults}`;
  
  const systemMsg = `Ты AI-помощник. Отвечай на русском. Используй контекст если есть.`;
  const userMsg = question + (context ? `\n\nКонтекст:\n${context}` : "");
  
  const answer = await askAI(env, systemMsg, userMsg);
  await saveConversation(env, userId, [
    {role: "user", content: question},
    {role: "assistant", content: answer}
  ]);
  return answer;
}

// Поиск в интернете
async function searchWeb(query) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    let results = "";
    if (data.AbstractText) {
      results += `${data.AbstractText}\n`;
    }
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      data.RelatedTopics.slice(0, 3).forEach(t => {
        if (t.Text) results += `• ${t.Text}\n`;
      });
    }
    return results || "";
  } catch (e) {
    return "";
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
    return results.join("\n\n---\n\n");
  } catch (e) {
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
    if (conv.length > maxMessages) conv = conv.slice(-maxMessages);
    await env.CONVERSATION_STORE.put(`conv_${userId}`, JSON.stringify(conv));
  } catch (e) {
    console.error("Save error:", e);
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
        max_tokens: 1000
      })
    });
    
    if (!r.ok) throw new Error(`API error: ${r.status}`);
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "Не могу ответить";
  } catch(e) {
    return "Ошибка: " + e.message;
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
          {role:"system",content:"Пост для Telegram про технологии. Заголовок с эмодзи, текст, 3-5 хэштегов."},
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
    body: JSON.stringify({chat_id: chatId, text: text, parse_mode: "Markdown"})
  }).then(r => r.json());
}

// Проверка на код
function looksLikeCode(text) {
  return /[{};=]/.test(text) && text.length < 500;
}

// Проверка на концепцию
function looksLikeConcept(text) {
  const concepts = ["что такое", "как работает", "объясни", "расскажи про"];
  return concepts.some(c => text.toLowerCase().includes(c));
}
