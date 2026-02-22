/**
 * AI Digest Bot - Universal AI Assistant
 * Любые темы: огород, бизнес, юриспруденция, программирование
 * Работа в группах и чатах
 */
const CHANNEL_ID = "-1001859702206";
const ADMIN_IDS = ["1271633868"];

// Темы для автопостинга
const AUTO_TOPICS = [
  "Последние новости ИИ за неделю",
  "Новые AI инструменты для бизнеса",
  "Как нейросети помогают в работе",
  "AI для юристов и бухгалтеров",
  "Автоматизация бизнеса с ИИ"
];

export default {
  async fetch(request, env) {
    try {
      if (request.method === "GET") {
        return new Response("AI Digest Bot 🤖\nУниверсальный помощник");
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
          const isGroup = chatType === "group" || chatType === "supergroup";
          
          // Упоминание бота в группе
          const mentionedInGroup = isGroup && (text.includes("@AidenHelpbot") || msg.reply_to_message?.from?.is_bot);
          
          // В группах отвечаем только на упоминания
          if (isGroup && !mentionedInGroup) {
            return new Response("OK");
          }
          
          let reply = "";
          
          // === КОМАНДЫ ===
          if (text === "/start") {
            reply = `👋 Привет, ${name}!

Я — **Aiden**, универсальный AI-помощник.

🌟 **Я помогаю по любым вопросам:**

💻 **Программирование:**
• Написание кода (Python, JS, Go...)
• Отладка и объяснение
• Архитектура и паттерны

📊 **Бизнес:**
• Бизнес-планы и стратегии
• Маркетинг и продажи
• Финансы и инвестиции

⚖️ **Юридические вопросы:**
• Общие консультации
• Документы и договоры
• Права потребителей

🏡 **Дом и огород:**
• Садоводство и растения
• Ремонт и строительство
• Домашние советы

📚 **Образование:**
• Объяснение концепций
• Помощь с учёбой
• Языки и наука

📋 **Команды:**
• /help — справка
• /ask [вопрос] — любой вопрос
• /code [задача] — написать код
• /business [вопрос] — бизнес-консультация
• /legal [вопрос] — юридический вопрос
• /garden [вопрос] — сад и огород
• /doc [тип] — шаблон документа

💡 **Просто напиши вопрос** — я помогу!`;
            
          } else if (text === "/help") {
            reply = `📖 **Справка:**

**📋 Категории помощи:**

💻 **Программирование:**
/code [задача] — написать код
/debug [код] — найти ошибку
/explain [концепция] — объяснить

📊 **Бизнес:**
/business [вопрос] — консультация
/plan [идея] — бизнес-план
/marketing [продукт] — стратегия

⚖️ **Юриспруденция:**
/legal [вопрос] — юр.консультация
/doc [тип] — шаблон документа
/rights [ситуация] — ваши права

🏡 **Дом и сад:**
/garden [вопрос] — сад и огород
/home [вопрос] — домашние советы
/repair [проблема] — ремонт

📚 **Общее:**
/ask [вопрос] — любой вопрос
/search [запрос] — поиск в базе
/memory — диалоги

**Примеры:**
• /business Как открыть ИП?
• /legal Права при возврате товара
• /garden Когда сажать помидоры?
• /code Напиши сайт на React

💡 Я помогу по ЛЮБОЙ теме!`;
            
          } else if (text === "/ask" || text.startsWith("/ask ")) {
            const question = text.replace("/ask ", "").trim();
            if (!question) {
              reply = "⚠️ Задайте вопрос!";
            } else {
              reply = await universalAnswer(env, uid, question);
            }
            
          } else if (text === "/code" || text.startsWith("/code ")) {
            const task = text.replace("/code ", "").trim();
            if (!task) {
              reply = "⚠️ Опишите задачу!";
            } else {
              reply = await writeCode(env, uid, task);
            }
            
          } else if (text === "/business" || text.startsWith("/business ")) {
            const question = text.replace("/business ", "").trim();
            reply = await businessConsult(env, uid, question);
            
          } else if (text === "/legal" || text.startsWith("/legal ")) {
            const question = text.replace("/legal ", "").trim();
            reply = await legalConsult(env, uid, question);
            
          } else if (text === "/garden" || text.startsWith("/garden ")) {
            const question = text.replace("/garden ", "").trim();
            reply = await gardenConsult(env, uid, question);
            
          } else if (text === "/doc" || text.startsWith("/doc ")) {
            const docType = text.replace("/doc ", "").trim();
            reply = await generateDocument(env, uid, docType);
            
          } else if (text === "/plan" || text.startsWith("/plan ")) {
            const idea = text.replace("/plan ", "").trim();
            reply = await businessPlan(env, uid, idea);
            
          } else if (text === "/memory") {
            const conv = await getConversation(env, uid);
            if (conv && conv.length > 0) {
              reply = `💭 **Диалоги**:\n\n`;
              conv.slice(-4).forEach((m, i) => {
                if (m.role === "user") reply += `❓ ${m.content.slice(0, 50)}...\n`;
              });
            } else {
              reply = "💭 Память пуста";
            }
            
          } else if (text === "/post" && ADMIN_IDS.includes(uid)) {
            const topic = text.replace("/post ", "").trim();
            const post = await generatePost(env, topic);
            const result = await sendMsg(env.BOT_TOKEN, CHANNEL_ID, post);
            reply = result.ok ? "✅ Опубликовано!" : `❌ ${result.description}`;
            
          } else if (text.startsWith("/")) {
            reply = `❓ Неизвестная команда. Используйте /help`;
            
          } else {
            // Обычный вопрос в группе или личке
            const cleanText = text.replace("@AidenHelpbot", "").trim();
            reply = await universalAnswer(env, uid, cleanText);
          }
          
          if (reply) {
            // В группах добавляем упоминание
            if (isGroup) {
              reply = `${name}, ${reply}`;
            }
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

// === УНИВЕРСАЛЬНЫЕ ФУНКЦИИ ===

// Универсальный ответ на любой вопрос
async function universalAnswer(env, userId, question) {
  const ragContext = await ragRetrieve(env, question);
  const webResults = await searchWeb(question);
  
  let context = "";
  if (ragContext) context += `📚 База:\n${ragContext}\n\n`;
  if (webResults) context += `🌐 Интернет:\n${webResults}`;
  
  const systemMsg = `Ты универсальный AI-помощник Aiden.
Отвечай на русском языке.
Помогай по любым вопросам: программирование, бизнес, юриспруденция, сад, дом, образование.
Будь полезен, конкретен и дружелюбен.
Используй контекст если есть.
Если не знаешь — честно скажи.`;

  const answer = await askAI(env, systemMsg, question + (context ? `\n\nКонтекст:\n${context}` : ""));
  await saveConversation(env, userId, [
    {role: "user", content: question},
    {role: "assistant", content: answer}
  ]);
  return answer;
}

// Бизнес-консультация
async function businessConsult(env, userId, question) {
  const systemMsg = `Ты бизнес-консультант с опытом 20 лет.
Специализация: стартапы, малый бизнес, маркетинг, финансы.
Давай практические советы.
Предупреждай о рисках.
Отвечай на русском.`;

  const answer = await askAI(env, systemMsg, `Бизнес-вопрос: ${question}`);
  await saveConversation(env, userId, [
    {role: "user", content: `Business: ${question}`},
    {role: "assistant", content: answer}
  ]);
  return `📊 **Бизнес-консультация**:\n\n${answer}`;
}

// Юридическая консультация
async function legalConsult(env, userId, question) {
  const systemMsg = `Ты юрист-консультант.
Специализация: гражданское право, защита прав потребителей, трудовое право.
⚠️ ВСЕГДА предупреждай что это общая информация, а не юр.консультация.
Рекомендуй обращаться к юристу для конкретных случаев.
Отвечай на русском.`;

  const answer = await askAI(env, systemMsg, `Юр.вопрос: ${question}\n\n⚠️ Добавь дисклеймер что это общая информация.`);
  await saveConversation(env, userId, [
    {role: "user", content: `Legal: ${question}`},
    {role: "assistant", content: answer}
  ]);
  return `⚖️ **Юридическая информация**:\n\n${answer}\n\n⚠️ _Это общая информация, не является юридической консультацией. Для конкретного случая обратитесь к юристу._`;
}

// Консультация по саду и огороду
async function gardenConsult(env, userId, question) {
  const systemMsg = `Ты агроном-консультант.
Специализация: сад, огород, комнатные растения.
Давай практические советы по сезонам.
Учитывай климат России/СНГ.
Отвечай на русском.`;

  const answer = await askAI(env, systemMsg, `Вопрос по саду/огороду: ${question}`);
  await saveConversation(env, userId, [
    {role: "user", content: `Garden: ${question}`},
    {role: "assistant", content: answer}
  ]);
  return `🏡 **Совет по саду/огороду**:\n\n${answer}`;
}

// Генерация документа
async function generateDocument(env, userId, docType) {
  const systemMsg = `Ты юрист-документовед.
Создавай шаблоны документов по российскому законодательству.
Форматируй в markdown.
Добавляй пояснения что заполнять.`;

  const answer = await askAI(env, systemMsg, `Создай шаблон: ${docType}`);
  await saveConversation(env, userId, [
    {role: "user", content: `Document: ${docType}`},
    {role: "assistant", content: answer}
  ]);
  return `📄 **Шаблон документа**:\n\n${answer}`;
}

// Бизнес-план
async function businessPlan(env, userId, idea) {
  const systemMsg = `Ты бизнес-консультант.
Создай структуру бизнес-плана.
Включи: описание, рынок, конкуренция, финансы, риски.
Будь конкретен но реалистичен.`;

  const answer = await askAI(env, systemMsg, `Бизнес-идея: ${idea}`);
  await saveConversation(env, userId, [
    {role: "user", content: `Plan: ${idea}`},
    {role: "assistant", content: answer}
  ]);
  return `📋 **Бизнес-план**:\n\n${answer}`;
}

// Написание кода
async function writeCode(env, userId, task) {
  const systemMsg = `Ты опытный программист.
Напиши чистый рабочий код.
Добавь комментарии на русском.
Укажи как использовать.`;

  const answer = await askAI(env, systemMsg, `Задача: ${task}`);
  await saveConversation(env, userId, [
    {role: "user", content: `Code: ${task}`},
    {role: "assistant", content: answer}
  ]);
  return `💻 **Код**:\n\n${answer}`;
}

// Поиск в интернете
async function searchWeb(query) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;
    const r = await fetch(url);
    const d = await r.json();
    let res = "";
    if (d.AbstractText) res += d.AbstractText;
    return res;
  } catch { return ""; }
}

// RAG поиск
async function ragRetrieve(env, query, topK = 3) {
  try {
    const keys = await env.RAG_STORE.list();
    const results = [];
    const q = query.toLowerCase().slice(0, 30);
    for (const key of keys.keys) {
      const val = await env.RAG_STORE.get(key.name);
      if (val && val.toLowerCase().includes(q)) {
        results.push(val);
        if (results.length >= topK) break;
      }
    }
    return results.join("\n\n---\n\n");
  } catch { return ""; }
}

// Диалоги
async function getConversation(env, userId) {
  try {
    const data = await env.CONVERSATION_STORE.get(`conv_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

async function saveConversation(env, userId, messages, max = 20) {
  try {
    let conv = await getConversation(env, userId);
    conv = conv.concat(messages);
    if (conv.length > max) conv = conv.slice(-max);
    await env.CONVERSATION_STORE.put(`conv_${userId}`, JSON.stringify(conv));
  } catch (e) { console.error(e); }
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
    if (!r.ok) throw new Error(`API ${r.status}`);
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "Не могу ответить";
  } catch(e) {
    return "Ошибка: " + e.message;
  }
}

// Пост
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
          {role:"system",content:"Пост для Telegram. Заголовок с эмодзи, текст, хэштеги."},
          {role:"user",content:"Тема: "+topic}
        ],
        max_tokens: 1000
      })
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content || `📝 ${topic}`;
  } catch(e) {
    return `📝 ${topic}`;
  }
}

// Сообщение
function sendMsg(token, chatId, text) {
  return fetch("https://api.telegram.org/bot"+token+"/sendMessage", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({chat_id: chatId, text: text, parse_mode: "Markdown"})
  }).then(r => r.json());
}
