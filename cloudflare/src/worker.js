/**
 * AI Digest Bot - MAXIMUM UNIVERSAL AI ASSISTANT
 * Все темы + Программирование + Смарт-контракты Solidity + Новости
 */
const CHANNEL_ID = "-1001859702206";
const ADMIN_IDS = ["1271633868"];

export default {
  async fetch(request, env) {
    try {
      if (request.method === "GET") {
        return new Response("AI Digest Bot 🤖\nУниверсальный AI-помощник PRO");
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
          const mentionedInGroup = isGroup && (text.includes("@AidenHelpbot") || msg.reply_to_message?.from?.is_bot);
          
          if (isGroup && !mentionedInGroup) return new Response("OK");
          
          let reply = "";
          
          // === КОМАНДЫ ===
          if (text === "/start") {
            reply = `👋 Привет, ${name}!

Я — **Aiden PRO**, максимально универсальный AI-помощник.

🌟 **ВСЕ ВОЗМОЖНОСТИ:**

💻 **ПРОГРАММИРОВАНИЕ:**
• Python, JavaScript, TypeScript, Go, Rust, Java, C++
• Solidity (смарт-контракты)
• Web3, DeFi, NFT
• Отладка, рефакторинг, тесты

📰 **НОВОСТИ И АНАЛИТИКА:**
• Новости всех стран
• Аналитические обзоры
• Прогнозы и тренды
• Дайджесты

📊 **БИЗНЕС:**
• Бизнес-планы, стратегии
• Маркетинг, финансы
• Стартапы, инвестиции

⚖️ **ЮРИСПРУДЕНЦИЯ:**
• Правовая информация
• Шаблоны документов
• Консультации

🏡 **ДОМ И САД:**
• Садоводство, растения
• Ремонт, строительство
• Домашние советы

📚 **ОБРАЗОВАНИЕ:**
• Помощь с учёбой
• Объяснение концепций
• Языки, наука

📋 **КОМАНДЫ:**

💻 **Код:**
/code [задача] — написать код
/solidity [контракт] — смарт-контракт
/debug [код] — найти ошибку
/explain [концепция] — объяснить
/refactor [код] — улучшить

📰 **Новости:**
/news [категория] — новости
/analyze [тема] — аналитика
/review [событие] — обзор
/forecast [тема] — прогноз
/digest — дайджест
/world [страна] — новости страны

📊 **Бизнес:**
/business [вопрос] — консультация
/plan [идея] — бизнес-план

⚖️ **Право:**
/legal [вопрос] — информация
/doc [тип] — шаблон

🏡 **Дом:**
/garden [вопрос] — сад
/home [вопрос] — дом

📚 **Общее:**
/ask [вопрос] — любой вопрос
/memory — диалоги
/help — справка

💡 **Примеры:**
• /solidity Токен ERC20
• /code API на FastAPI
• /news Технологии
• /analyze Влияние ИИ
• /business Как открыть ИП?

🚀 Напиши любой вопрос — я помогу!`;
            
          } else if (text === "/help") {
            reply = `📖 **ПОЛНАЯ СПРАВКА:**

**💻 ПРОГРАММИРОВАНИЕ:**
/code [задача] — код на любом языке
/solidity [контракт] — смарт-контракт
/debug [код] — отладка
/explain [концепция] — объяснение
/refactor [код] — улучшение
/test [код] — написать тесты

**📰 НОВОСТИ:**
/news [категория] — новости
/analyze [тема] — аналитика
/review [событие] — обзор
/forecast [тема] — прогноз
/digest — дайджест за день
/world [страна] — новости страны

**📊 БИЗНЕС:**
/business [вопрос] — консультация
/plan [идея] — бизнес-план
/marketing [продукт] — стратегия

**⚖️ ЮРИСПРУДЕНЦИЯ:**
/legal [вопрос] — информация
/doc [тип] — шаблон документа

**🏡 ДОМ И САД:**
/garden [вопрос] — сад/огород
/home [вопрос] — дом/ремонт

**📚 ОБРАЗОВАНИЕ:**
/ask [вопрос] — любой вопрос
/explain [концепция] — объяснить

**🔧 ЕЩЁ:**
/memory — мои диалоги
/start — приветствие

**ЯЗЫКИ ПРОГРАММИРОВАНИЯ:**
Python, JavaScript, TypeScript, Go, Rust, Java, C++, PHP, Ruby, Swift, Kotlin, Solidity, Vyper

**ПРИМЕРЫ:**
• /solidity NFT контракт
• /code Телеграм бот на Python
• /news ИИ
• /analyze Криптовалюты
• /business Кофейня
• /legal Договор аренды`;
            
          } else if (text === "/code" || text.startsWith("/code ")) {
            const task = text.replace("/code ", "").trim();
            reply = task ? await writeCode(env, uid, task) : "⚠️ Опишите задачу!";
            
          } else if (text === "/solidity" || text.startsWith("/solidity ")) {
            const contract = text.replace("/solidity ", "").trim();
            reply = contract ? await writeSolidity(env, uid, contract) : "⚠️ Опишите контракт!";
            
          } else if (text === "/debug" || text.startsWith("/debug ")) {
            const code = text.replace("/debug ", "").trim();
            reply = code ? await debugCode(env, uid, code) : "⚠️ Вставьте код!";
            
          } else if (text === "/explain" || text.startsWith("/explain ")) {
            const concept = text.replace("/explain ", "").trim();
            reply = concept ? await explainConcept(env, uid, concept) : "⚠️ Что объяснить?";
            
          } else if (text === "/refactor" || text.startsWith("/refactor ")) {
            const code = text.replace("/refactor ", "").trim();
            reply = code ? await refactorCode(env, uid, code) : "⚠️ Вставьте код!";
            
          } else if (text === "/news" || text.startsWith("/news ")) {
            const cat = text.replace("/news ", "").trim();
            reply = await getNews(env, uid, cat || "Главные");
            
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
            
          } else if (text === "/business" || text.startsWith("/business ")) {
            const q = text.replace("/business ", "").trim();
            reply = q ? await businessConsult(env, uid, q) : "⚠️ Задайте вопрос!";
            
          } else if (text === "/plan" || text.startsWith("/plan ")) {
            const idea = text.replace("/plan ", "").trim();
            reply = idea ? await businessPlan(env, uid, idea) : "⚠️ Опишите идею!";
            
          } else if (text === "/legal" || text.startsWith("/legal ")) {
            const q = text.replace("/legal ", "").trim();
            reply = q ? await legalConsult(env, uid, q) : "⚠️ Задайте вопрос!";
            
          } else if (text === "/doc" || text.startsWith("/doc ")) {
            const type = text.replace("/doc ", "").trim();
            reply = type ? await generateDocument(env, uid, type) : "⚠️ Укажите тип!";
            
          } else if (text === "/garden" || text.startsWith("/garden ")) {
            const q = text.replace("/garden ", "").trim();
            reply = q ? await gardenConsult(env, uid, q) : "⚠️ Задайте вопрос!";
            
          } else if (text === "/home" || text.startsWith("/home ")) {
            const q = text.replace("/home ", "").trim();
            reply = q ? await homeConsult(env, uid, q) : "⚠️ Задайте вопрос!";
            
          } else if (text === "/ask" || text.startsWith("/ask ")) {
            const q = text.replace("/ask ", "").trim();
            reply = q ? await universalAnswer(env, uid, q) : "⚠️ Задайте вопрос!";
            
          } else if (text === "/memory") {
            const conv = await getConversation(env, uid);
            if (conv && conv.length > 0) {
              reply = `💭 **Диалоги**:\n\n`;
              conv.slice(-6).forEach(m => {
                if (m.role === "user") reply += `❓ ${m.content.slice(0, 50)}...\n`;
              });
            } else reply = "💭 Память пуста";
            
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
  
  async scheduled(event, env) {
    const hour = new Date().getUTCHours();
    if (hour === 6) await sendMsg(env.BOT_TOKEN, CHANNEL_ID, await getDailyDigest(env, "auto"));
    if (hour === 12) await sendMsg(env.BOT_TOKEN, CHANNEL_ID, await getNews(env, "auto", "Технологии"));
    if (hour === 18) await sendMsg(env.BOT_TOKEN, CHANNEL_ID, await getWorldNews(env, "auto", "Мир"));
  }
};

// === ПРОГРАММИРОВАНИЕ ===

async function writeSolidity(env, userId, contractType) {
  const prompts = {
    "токен": "ERC20 токен с mint и burn",
    "nft": "ERC721 NFT контракт с mint",
    "стейкинг": "Стейкинг контракт с rewards",
    "defi": "DeFi пул ликвидности",
    "dao": "DAO с голосованием",
    "multisig": "Multisig кошелёк"
  };
  
  const type = Object.keys(prompts).find(k => contractType.toLowerCase().includes(k)) || "токен";
  const spec = prompts[type];
  
  const systemMsg = `Ты эксперт по Solidity и смарт-контрактам.
Напиши профессиональный смарт-контракт.
Включи:
- SPDX license
- Pragmas
- Импорт OpenZeppelin
- Контракт с функциями
- События
- Модификаторы
- Безопасность (reentrancy guard и т.д.)

Форматируй в markdown блоке \`\`\`solidity`;

  const answer = await askAI(env, systemMsg, `Создай смарт-контракт: ${contractType}. ${spec}. Добавь комментарии на русском.`);
  await saveConversation(env, userId, [
    {role: "user", content: `Solidity: ${contractType}`},
    {role: "assistant", content: answer}
  ]);
  return `⛓️ **Смарт-контракт Solidity**:\n\n${answer}\n\n⚠️ _Протестируй перед деплоем!_`;
}

async function writeCode(env, userId, task) {
  const systemMsg = `Ты senior разработчик. Напиши чистый, рабочий код. Добавь комментарии на русском. Укажи как запустить.`;
  const answer = await askAI(env, systemMsg, `Задача: ${task}`);
  await saveConversation(env, userId, [
    {role: "user", content: `Code: ${task}`},
    {role: "assistant", content: answer}
  ]);
  return `💻 **Код**:\n\n${answer}`;
}

async function debugCode(env, userId, code) {
  const systemMsg = `Ты эксперт по отладке. Найди ошибки, объясни, предложи исправление.`;
  const answer = await askAI(env, systemMsg, `Найди ошибку:\n\`\`\`\n${code}\n\`\`\``);
  await saveConversation(env, userId, [
    {role: "user", content: `Debug: ${code.slice(0, 200)}`},
    {role: "assistant", content: answer}
  ]);
  return `🔧 **Отладка**:\n\n${answer}`;
}

async function explainConcept(env, userId, concept) {
  const systemMsg = `Ты учитель. Объясни просто, с примерами и аналогиями.`;
  const answer = await askAI(env, systemMsg, `Объясни: ${concept}`);
  await saveConversation(env, userId, [
    {role: "user", content: `Explain: ${concept}`},
    {role: "assistant", content: answer}
  ]);
  return `📚 **Объяснение**:\n\n${answer}`;
}

async function refactorCode(env, userId, code) {
  const systemMsg = `Ты эксперт по рефакторингу. Улучши код: чище, быстрее, читаемее. Объясни изменения.`;
  const answer = await askAI(env, systemMsg, `Улучши:\n\`\`\`\n${code}\n\`\`\``);
  await saveConversation(env, userId, [
    {role: "user", content: `Refactor: ${code.slice(0, 200)}`},
    {role: "assistant", content: answer}
  ]);
  return `✨ **Рефакторинг**:\n\n${answer}`;
}

// === НОВОСТИ ===

async function getNews(env, userId, category) {
  const systemMsg = `Ты новостной редактор. Обзор новостей: ${category}. Формат: заголовок, 🔹 новости, 📊 аналитика, хэштеги.`;
  const answer = await askAI(env, systemMsg, `Новости: ${category}`);
  if (userId !== "auto") await saveConversation(env, userId, [{role: "user", content: `News: ${category}`}, {role: "assistant", content: answer}]);
  return answer;
}

async function analyzeTopic(env, userId, topic) {
  const systemMsg = `Ты аналитик. Глубокий анализ: ${topic}. Структура: суть, факты, контекст, анализ, тренды, прогноз.`;
  const answer = await askAI(env, systemMsg, `Анализ: ${topic}`);
  await saveConversation(env, userId, [{role: "user", content: `Analyze: ${topic}`}, {role: "assistant", content: answer}]);
  return `🔍 **АНАЛИТИКА**:\n\n${answer}`;
}

async function reviewEvent(env, userId, event) {
  const systemMsg = `Ты журналист. Обзор: ${event}. Что, когда, кто, причины, последствия, реакция.`;
  const answer = await askAI(env, systemMsg, `Обзор: ${event}`);
  await saveConversation(env, userId, [{role: "user", content: `Review: ${event}`}, {role: "assistant", content: answer}]);
  return `📋 **ОБЗОР**:\n\n${answer}`;
}

async function forecastTopic(env, userId, topic) {
  const systemMsg = `Ты футуролог. Прогноз: ${topic}. Тренды, риски, возможности, сценарии.`;
  const answer = await askAI(env, systemMsg, `Прогноз: ${topic}`);
  await saveConversation(env, userId, [{role: "user", content: `Forecast: ${topic}`}, {role: "assistant", content: answer}]);
  return `🔮 **ПРОГНОЗ**:\n\n${answer}`;
}

async function getDailyDigest(env, userId) {
  const systemMsg = `Ты главред. Дайджест за ${new Date().toLocaleDateString('ru-RU')}. Мир, технологии, бизнес, спорт, наука. Только главное.`;
  const answer = await askAI(env, systemMsg, "Дайджест");
  if (userId !== "auto") await saveConversation(env, userId, [{role: "user", content: "Digest"}, {role: "assistant", content: answer}]);
  return answer;
}

async function getWorldNews(env, userId, country) {
  const systemMsg = `Ты международный обозреватель. Новости: ${country}. Политика, экономика, общество, технологии.`;
  const answer = await askAI(env, systemMsg, `Новости: ${country}`);
  if (userId !== "auto") await saveConversation(env, userId, [{role: "user", content: `World: ${country}`}, {role: "assistant", content: answer}]);
  return answer;
}

// === БИЗНЕС ===

async function businessConsult(env, userId, question) {
  const systemMsg = `Ты бизнес-консультант. Давай практические советы.`;
  const answer = await askAI(env, systemMsg, `Бизнес: ${question}`);
  await saveConversation(env, userId, [{role: "user", content: `Business: ${question}`}, {role: "assistant", content: answer}]);
  return `📊 **КОНСУЛЬТАЦИЯ**:\n\n${answer}`;
}

async function businessPlan(env, userId, idea) {
  const systemMsg = `Ты бизнес-консультант. Структура: описание, рынок, конкуренция, финансы, риски.`;
  const answer = await askAI(env, systemMsg, `Бизнес-идея: ${idea}`);
  await saveConversation(env, userId, [{role: "user", content: `Plan: ${idea}`}, {role: "assistant", content: answer}]);
  return `📋 **БИЗНЕС-ПЛАН**:\n\n${answer}`;
}

// === ЮРИСПРУДЕНЦИЯ ===

async function legalConsult(env, userId, question) {
  const systemMsg = `Ты юрист. ⚠️ Добавь дисклеймер.`;
  const answer = await askAI(env, systemMsg, `Юр: ${question}`);
  await saveConversation(env, userId, [{role: "user", content: `Legal: ${question}`}, {role: "assistant", content: answer}]);
  return `⚖️ **ИНФОРМАЦИЯ**:\n\n${answer}\n\n⚠️ _Не является юр.консультацией._`;
}

async function generateDocument(env, userId, docType) {
  const systemMsg = `Ты юрист. Шаблон по российскому праву. Добавь пояснения.`;
  const answer = await askAI(env, systemMsg, `Шаблон: ${docType}`);
  await saveConversation(env, userId, [{role: "user", content: `Document: ${docType}`}, {role: "assistant", content: answer}]);
  return `📄 **ШАБЛОН**:\n\n${answer}`;
}

// === ДОМ И САД ===

async function gardenConsult(env, userId, question) {
  const systemMsg = `Ты агроном. Советы по сезонам для России/СНГ.`;
  const answer = await askAI(env, systemMsg, `Сад: ${question}`);
  await saveConversation(env, userId, [{role: "user", content: `Garden: ${question}`}, {role: "assistant", content: answer}]);
  return `🏡 **СОВЕТ**:\n\n${answer}`;
}

async function homeConsult(env, userId, question) {
  const systemMsg = `Ты мастер на все руки. Практические советы по дому.`;
  const answer = await askAI(env, systemMsg, `Дом: ${question}`);
  await saveConversation(env, userId, [{role: "user", content: `Home: ${question}`}, {role: "assistant", content: answer}]);
  return `🏠 **СОВЕТ**:\n\n${answer}`;
}

// === ОБЩЕЕ ===

async function universalAnswer(env, userId, question) {
  const ragContext = await ragRetrieve(env, question);
  const webResults = await searchWeb(question);
  let context = "";
  if (ragContext) context += `📚 База:\n${ragContext}\n\n`;
  if (webResults) context += `🌐 Интернет:\n${webResults}`;
  const systemMsg = `Ты Aiden, универсальный помощник. Отвечай на русском. Будь полезен.`;
  const answer = await askAI(env, systemMsg, question + (context ? `\n\nКонтекст:\n${context}` : ""));
  await saveConversation(env, userId, [{role: "user", content: question}, {role: "assistant", content: answer}]);
  return answer;
}

// === УТИЛИТЫ ===

async function searchWeb(query) {
  try {
    const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
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
        messages: [{role: "system", content: system}, {role: "user", content: user}],
        max_tokens: 1500
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
        messages: [{role:"system",content:"Пост для Telegram. Заголовок с эмодзи, текст, хэштеги."}, {role:"user",content:"Тема: "+topic}],
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
