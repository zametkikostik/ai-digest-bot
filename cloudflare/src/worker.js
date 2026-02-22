/**
 * AI Digest Bot - Universal Assistant + News Analyst
 * Новости мира, аналитика, обзоры для каналов
 */
const CHANNEL_ID = "-1001859702206";
const ADMIN_IDS = ["1271633868"];

// Новостные категории
const NEWS_CATEGORIES = [
  "Технологии и ИИ",
  "Бизнес и финансы",
  "Наука и медицина",
  "Политика (международная)",
  "Экономика",
  "Спорт",
  "Культура и развлечения",
  "Экология и климат",
  "Космос",
  "Образование"
];

// Страны для новостей
const COUNTRIES = [
  "Россия",
  "США",
  "Китай",
  "Европейский союз",
  "Великобритания",
  "Япония",
  "Индия",
  "Бразилия",
  "Германия",
  "Франция"
];

export default {
  async fetch(request, env) {
    try {
      if (request.method === "GET") {
        return new Response("AI Digest Bot 🤖\nНовости + Аналитика");
      }
      
      if (request.method === "POST") {
        const update = await request.json();
        
        // Обработка сообщений
        if (update.message) {
          const msg = update.message;
          const chatId = msg.chat.id;
          const text = msg.text || "";
          const name = msg.from?.first_name || "User";
          const uid = msg.from?.id?.toString();
          const chatType = msg.chat.type;
          
          const isGroup = chatType === "group" || chatType === "supergroup";
          const isChannel = chatType === "channel";
          const mentionedInGroup = isGroup && (text.includes("@AidenHelpbot") || msg.reply_to_message?.from?.is_bot);
          
          // В группах отвечаем только на упоминания
          if (isGroup && !mentionedInGroup) {
            return new Response("OK");
          }
          
          let reply = "";
          
          // === КОМАНДЫ ===
          if (text === "/start") {
            reply = `👋 Привет, ${name}!

Я — **Aiden**, универсальный AI-помощник с функцией новостного аналитика.

🌟 **Что я умею:**

📰 **Новости и аналитика:**
• Новости всех стран мира
• Аналитические обзоры
• Прогнозы и тренды
• Для новостных каналов

💻 **Программирование:**
• Написание кода
• Отладка и объяснение

📊 **Бизнес:**
• Бизнес-консультации
• Планы и стратегии

⚖️ **Юриспруденция:**
• Правовая информация
• Шаблоны документов

🏡 **Дом и сад:**
• Советы по хозяйству
• Садоводство

📋 **Команды:**
• /help — справка
• /news [категория] — новости
• /analyze [тема] — аналитика
• /review [событие] — обзор
• /forecast [тема] — прогноз
• /digest — дайджест за день
• /ask [вопрос] — любой вопрос
• /code [задача] — написать код
• /business [вопрос] — бизнес
• /legal [вопрос] — юриспруденция
• /garden [вопрос] — сад

💡 Для новостных каналов:
Добавьте бота и используйте /news или автопостинг!`;
            
          } else if (text === "/help") {
            reply = `📖 **Справка:**

**📰 Новости:**
/news [категория] — новости категории
/news — последние новости
/analyze [тема] — аналитика
/review [событие] — обзор события
/forecast [тема] — прогноз
/digest — дайджест за день
/world [страна] — новости страны

**💻 Программирование:**
/code [задача] — написать код
/debug [код] — найти ошибку

**📊 Бизнес:**
/business [вопрос] — консультация
/plan [идея] — бизнес-план

**⚖️ Юриспруденция:**
/legal [вопрос] — информация
/doc [тип] — шаблон

**🏡 Дом и сад:**
/garden [вопрос] — совет

**📚 Общее:**
/ask [вопрос] — любой вопрос
/memory — диалоги

**Примеры:**
• /news Технологии
• /analyze Влияние ИИ на экономику
• /review Выборы в США
• /forecast Рынок криптовалют`;
            
          } else if (text === "/news" || text.startsWith("/news ")) {
            const category = text.replace("/news ", "").trim();
            reply = await getNews(env, uid, category || "Главные");
            
          } else if (text === "/analyze" || text.startsWith("/analyze ")) {
            const topic = text.replace("/analyze ", "").trim();
            reply = await analyzeTopic(env, uid, topic);
            
          } else if (text === "/review" || text.startsWith("/review ")) {
            const event = text.replace("/review ", "").trim();
            reply = await reviewEvent(env, uid, event);
            
          } else if (text === "/forecast" || text.startsWith("/forecast ")) {
            const topic = text.replace("/forecast ", "").trim();
            reply = await forecastTopic(env, uid, topic);
            
          } else if (text === "/digest") {
            reply = await getDailyDigest(env, uid);
            
          } else if (text === "/world" || text.startsWith("/world ")) {
            const country = text.replace("/world ", "").trim();
            reply = await getWorldNews(env, uid, country);
            
          } else if (text === "/ask" || text.startsWith("/ask ")) {
            const question = text.replace("/ask ", "").trim();
            reply = await universalAnswer(env, uid, question);
            
          } else if (text === "/code" || text.startsWith("/code ")) {
            const task = text.replace("/code ", "").trim();
            reply = await writeCode(env, uid, task);
            
          } else if (text === "/business" || text.startsWith("/business ")) {
            const question = text.replace("/business ", "").trim();
            reply = await businessConsult(env, uid, question);
            
          } else if (text === "/legal" || text.startsWith("/legal ")) {
            const question = text.replace("/legal ", "").trim();
            reply = await legalConsult(env, uid, question);
            
          } else if (text === "/garden" || text.startsWith("/garden ")) {
            const question = text.replace("/garden ", "").trim();
            reply = await gardenConsult(env, uid, question);
            
          } else if (text === "/memory") {
            const conv = await getConversation(env, uid);
            if (conv && conv.length > 0) {
              reply = `💭 **Диалоги**:\n\n`;
              conv.slice(-6).forEach(m => {
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
            const cleanText = text.replace("@AidenHelpbot", "").trim();
            reply = await universalAnswer(env, uid, cleanText);
          }
          
          if (reply) {
            if (isGroup) reply = `${name}, ${reply}`;
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
  
  // Автопостинг новостей (каждые 3 часа)
  async scheduled(event, env) {
    const hour = new Date().getUTCHours();
    
    // Утренний дайджест (6 UTC)
    if (hour === 6) {
      const digest = await getDailyDigest(env, "auto");
      await sendMsg(env.BOT_TOKEN, CHANNEL_ID, digest);
      console.log("Morning digest posted");
    }
    
    // Новости технологий (12 UTC)
    if (hour === 12) {
      const techNews = await getNews(env, "auto", "Технологии");
      await sendMsg(env.BOT_TOKEN, CHANNEL_ID, techNews);
      console.log("Tech news posted");
    }
    
    // Мировые новости (18 UTC)
    if (hour === 18) {
      const worldNews = await getWorldNews(env, "auto", "Мир");
      await sendMsg(env.BOT_TOKEN, CHANNEL_ID, worldNews);
      console.log("World news posted");
    }
  }
};

// === НОВОСТНЫЕ ФУНКЦИИ ===

// Получение новостей
async function getNews(env, userId, category) {
  const systemMsg = `Ты новостной редактор.
Создай обзор новостей по категории: ${category}.
Формат:
📰 ЗАГОЛОВОК

🔹 Главная новость
🔹 Важное событие
🔹 Интересный факт

📊 **Аналитика**:
Краткий анализ трендов.

#Новости #${category.replace(/\s/g, '')}

Используй актуальные данные. Отвечай на русском.`;

  const answer = await askAI(env, systemMsg, `Новости: ${category}`);
  if (userId !== "auto") {
    await saveConversation(env, userId, [
      {role: "user", content: `News: ${category}`},
      {role: "assistant", content: answer}
    ]);
  }
  return answer;
}

// Аналитика темы
async function analyzeTopic(env, userId, topic) {
  const systemMsg = `Ты аналитик-эксперт.
Сделай глубокий анализ темы: ${topic}.

Структура:
🔍 **АНАЛИТИЧЕСКИЙ ОБЗОР**

📌 **Суть проблемы/темы**:
...

📊 **Факты и цифры**:
...

🌍 **Мировой контекст**:
...

💡 **Анализ**:
- Причины
- Следствия
- Заинтересованные стороны

📈 **Тренды**:
...

🔮 **Прогноз**:
...

#Аналитика #${topic.replace(/\s/g, '')}

Будь объективен, приводи факты.`;

  const answer = await askAI(env, systemMsg, `Анализ: ${topic}`);
  await saveConversation(env, userId, [
    {role: "user", content: `Analyze: ${topic}`},
    {role: "assistant", content: answer}
  ]);
  return answer;
}

// Обзор события
async function reviewEvent(env, userId, event) {
  const systemMsg = `Ты журналист-аналитик.
Сделай обзор события: ${event}.

Формат:
📋 **ОБЗОР СОБЫТИЯ**

📍 **Что произошло**:
...

⏰ **Когда**:
...

👥 **Участники**:
...

🎯 **Причины**:
...

📊 **Последствия**:
...

🌍 **Реакция мира**:
...

💭 **Комментарий**:
...

#Обзор #События

Будь объективен, покажи разные точки зрения.`;

  const answer = await askAI(env, systemMsg, `Обзор: ${event}`);
  await saveConversation(env, userId, [
    {role: "user", content: `Review: ${event}`},
    {role: "assistant", content: answer}
  ]);
  return answer;
}

// Прогноз
async function forecastTopic(env, userId, topic) {
  const systemMsg = `Ты футуролог-аналитик.
Сделай прогноз по теме: ${topic}.

Формат:
🔮 **ПРОГНОЗ**

📊 **Текущее состояние**:
...

📈 **Тренды**:
- Краткосрочные (1 год)
- Среднесрочные (3-5 лет)
- Долгосрочные (10+ лет)

⚠️ **Риски**:
...

💡 **Возможности**:
...

🎯 **Наиболее вероятный сценарий**:
...

#Прогноз #${topic.replace(/\s/g, '')}

Будь реалистичен, основывайся на фактах.`;

  const answer = await askAI(env, systemMsg, `Прогноз: ${topic}`);
  await saveConversation(env, userId, [
    {role: "user", content: `Forecast: ${topic}`},
    {role: "assistant", content: answer}
  ]);
  return answer;
}

// Дайджест за день
async function getDailyDigest(env, userId) {
  const systemMsg = `Ты главный редактор.
Создай ежедневный дайджест главных новостей.

Формат:
📰 **ДАЙДЖЕСТ ЗА ДЕНЬ**
${new Date().toLocaleDateString('ru-RU')}

🌍 **Мир**:
• ...

💻 **Технологии**:
• ...

📊 **Бизнес**:
• ...

⚽ **Спорт**:
• ...

🎬 **Культура**:
• ...

🔬 **Наука**:
• ...

📈 **Главный тренд дня**:
...

#Дайджест #Новости

Только главное, без воды.`;

  const answer = await askAI(env, systemMsg, "Ежедневный дайджест главных новостей мира");
  if (userId !== "auto") {
    await saveConversation(env, userId, [
      {role: "user", content: "Digest"},
      {role: "assistant", content: answer}
    ]);
  }
  return answer;
}

// Новости мира по странам
async function getWorldNews(env, userId, country) {
  const systemMsg = `Ты международный обозреватель.
Новости из страны: ${country}.

Формат:
🌍 **НОВОСТИ: ${country.toUpperCase()}**

🏛️ **Политика**:
...

💰 **Экономика**:
...

👥 **Общество**:
...

🔬 **Наука и технологии**:
...

📊 **Важные цифры**:
...

🔍 **Анализ**:
...

#Мир #${country.replace(/\s/g, '')}

Будь объективен.`;

  const answer = await askAI(env, systemMsg, `Новости: ${country}`);
  await saveConversation(env, userId, [
    {role: "user", content: `World: ${country}`},
    {role: "assistant", content: answer}
  ]);
  return answer;
}

// === ОБЩИЕ ФУНКЦИИ ===

async function universalAnswer(env, userId, question) {
  const ragContext = await ragRetrieve(env, question);
  const webResults = await searchWeb(question);
  
  let context = "";
  if (ragContext) context += `📚 База:\n${ragContext}\n\n`;
  if (webResults) context += `🌐 Интернет:\n${webResults}`;
  
  const systemMsg = `Ты универсальный AI-помощник Aiden. Отвечай на русском. Будь полезен.`;
  const answer = await askAI(env, systemMsg, question + (context ? `\n\nКонтекст:\n${context}` : ""));
  await saveConversation(env, userId, [
    {role: "user", content: question},
    {role: "assistant", content: answer}
  ]);
  return answer;
}

async function businessConsult(env, userId, question) {
  const systemMsg = `Ты бизнес-консультант. Давай практические советы.`;
  const answer = await askAI(env, systemMsg, `Бизнес: ${question}`);
  await saveConversation(env, userId, [
    {role: "user", content: `Business: ${question}`},
    {role: "assistant", content: answer}
  ]);
  return `📊 **Бизнес-консультация**:\n\n${answer}`;
}

async function legalConsult(env, userId, question) {
  const systemMsg = `Ты юрист. ⚠️ Добавь дисклеймер.`;
  const answer = await askAI(env, systemMsg, `Юр: ${question}`);
  await saveConversation(env, userId, [
    {role: "user", content: `Legal: ${question}`},
    {role: "assistant", content: answer}
  ]);
  return `⚖️ **Информация**:\n\n${answer}\n\n⚠️ _Не является юр.консультацией._`;
}

async function gardenConsult(env, userId, question) {
  const systemMsg = `Ты агроном. Давай советы по сезонам.`;
  const answer = await askAI(env, systemMsg, `Сад: ${question}`);
  await saveConversation(env, userId, [
    {role: "user", content: `Garden: ${question}`},
    {role: "assistant", content: answer}
  ]);
  return `🏡 **Совет**:\n\n${answer}`;
}

async function writeCode(env, userId, task) {
  const systemMsg = `Ты программист. Пиши чистый код с комментариями.`;
  const answer = await askAI(env, systemMsg, `Код: ${task}`);
  await saveConversation(env, userId, [
    {role: "user", content: `Code: ${task}`},
    {role: "assistant", content: answer}
  ]);
  return `💻 **Код**:\n\n${answer}`;
}

async function searchWeb(query) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;
    const r = await fetch(url);
    const d = await r.json();
    return d.AbstractText || "";
  } catch { return ""; }
}

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
        max_tokens: 1200
      })
    });
    if (!r.ok) throw new Error(`API ${r.status}`);
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "Не могу ответить";
  } catch(e) {
    return "Ошибка: " + e.message;
  }
}

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

function sendMsg(token, chatId, text) {
  return fetch("https://api.telegram.org/bot"+token+"/sendMessage", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({chat_id: chatId, text: text, parse_mode: "Markdown"})
  }).then(r => r.json());
}
