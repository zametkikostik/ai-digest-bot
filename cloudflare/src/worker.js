/**
 * AI Digest Bot - PRIVATE INVESTMENT CHAT EDITION
 * Закрытый чат: https://t.me/+CBHQG7uflyFmY2Ey
 * Инвестиции, Криптовалюты, Бизнес
 */
const ADMIN_IDS = ["1271633868"];

// База знаний для самообучения
const KNOWLEDGE_BASE = {
  investments: [
    "Акции — доля владения компанией. Покупая акции, вы становитесь совладельцем.",
    "Облигации — долговые бумаги. Вы даёте в долг компании/государству под процент.",
    "ETF — биржевой фонд, повторяющий индекс (например, S&P 500).",
    "Дивиденды — часть прибыли компании акционерам.",
    "ИИС — индивидуальный инвестсчёт с налоговыми льготами в РФ.",
    "Диверсификация — распределение капитала для снижения рисков.",
    "Сложный процент — реинвестирование прибыли для роста капитала."
  ],
  crypto: [
    "Биткоин — первая криптовалюта, создана в 2009 году.",
    "Блокчейн — распределённая база данных для криптовалют.",
    "DeFi — децентрализованные финансы на смарт-контрактах.",
    "Стейкинг — заработок на хранении в PoS сетях.",
    "NFT — уникальный токен цифрового актива.",
    "Альткоины — все криптовалюты кроме Биткоина.",
    "HODL — стратегия долгосрочного хранения крипты."
  ],
  business: [
    "Стартап — компания в поиске масштабируемой бизнес-модели.",
    "Бизнес-модель Canvas — инструмент описания из 9 блоков.",
    "Франшиза — право использовать бренд за роялти.",
    "MVP — минимальный продукт для проверки гипотез.",
    "Unit-экономика — расчёт экономики одного клиента.",
    "B2B — бизнес для бизнеса.",
    "B2C — бизнес для потребителей."
  ]
};

// Темы для автопостинга
const AUTO_TOPICS = {
  invest: [
    "Топ-5 акций для покупки в 2026",
    "Как начать инвестировать с 1000₽",
    "Обзор ETF фондов для новичков",
    "Дивидендные стратегии",
    "Как оценить компанию перед покупкой"
  ],
  crypto: [
    "Биткоин vs Золото: что выбрать",
    "Обзор альткоинов на 2026",
    "DeFi: заработок на ликвидности",
    "Стейкинг криптовалют: гайд",
    "Анализ рынка криптовалют"
  ],
  business: [
    "Как открыть стартап с нуля",
    "Бизнес-модель Canvas: разбор",
    "Франшиза vs свой бренд",
    "Маркетинг для малого бизнеса",
    "Онлайн бизнес: идеи 2026"
  ]
};

export default {
  async fetch(request, env) {
    if (request.method === "GET") return new Response("Aiden Invest Bot OK");
    
    if (request.method === "POST") {
      const update = await request.json();
      
      // Кнопки
      if (update.callback_query) {
        const cb = update.callback_query;
        await handleCallback(env, cb.message.chat.id, cb.data, cb.message.message_id);
        return new Response("OK");
      }
      
      // Сообщения
      if (update.message) {
        const msg = update.message;
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const name = msg.from?.first_name || "User";
        const uid = msg.from?.id?.toString();
        const chatType = msg.chat.type;
        
        // В группах отвечаем на команды и упоминания
        const isGroup = chatType === "group" || chatType === "supergroup";
        if (isGroup && !text.startsWith("/") && !text.includes("@AidenHelpbot")) {
          return new Response("OK");
        }
        
        let reply = "";
        
        if (text === "/start") {
          reply = `👋 Привет, ${name}!

Я — **Aiden**, твой AI-помощник по инвестициям.

💰 **ТЕМЫ:**
• Инвестиции и акции
• Криптовалюты и DeFi
• Бизнес и стартапы

📋 **КОМАНДЫ:**
/invest [вопрос] — про инвестиции
/crypto [вопрос] — про крипту
/business [вопрос] — про бизнес
/learn [тема] — обучение
/news — новости рынков

**Жми кнопки!** 👇`;
          await sendKB(env, chatId, reply, getMainKB());
          return new Response("OK");
        }
        
        if (text === "/help") {
          reply = `📖 **СПРАВКА:**

**💰 Инвестиции:**
/invest Акции — про акции
/invest Облигации — про облигации
/invest ETF — про фонды

**₿ Криптовалюты:**
/crypto Биткоин — про BTC
/crypto DeFi — про DeFi
/crypto NFT — про NFT

**📊 Бизнес:**
/business Стартап — про стартапы
/business Маркетинг — про маркетинг

**📚 Обучение:**
/learn Инвестиции — база
/learn Крипта — база
/learn Бизнес — база

**Кнопки внизу!**`;
          await sendKB(env, chatId, reply, getHelpKB());
          return new Response("OK");
        }
        
        if (text.startsWith("/invest ")) {
          const q = text.replace("/invest ", "");
          reply = await investAnswer(env, uid, q);
        } else if (text.startsWith("/crypto ")) {
          const q = text.replace("/crypto ", "");
          reply = await cryptoAnswer(env, uid, q);
        } else if (text.startsWith("/business ")) {
          const q = text.replace("/business ", "");
          reply = await businessAnswer(env, uid, q);
        } else if (text.startsWith("/learn ")) {
          const topic = text.replace("/learn ", "");
          reply = await learnTopic(env, uid, topic);
        } else if (text === "/news") {
          reply = await getMarketNews(env, uid);
        } else if (text.startsWith("/ask ")) {
          reply = await ai(env, text.replace("/ask ", ""));
        } else if (text.startsWith("/")) {
          reply = "❓ Неизвестная команда. Используйте /help";
        } else if (text.includes("@AidenHelpbot")) {
          const q = text.replace("@AidenHelpbot", "").trim();
          reply = await ai(env, q);
        } else {
          return new Response("OK"); // Игнорируем обычные сообщения
        }
        
        if (reply) await sendMsg(env.BOT_TOKEN, chatId, reply);
      }
      
      return new Response("OK");
    }
    
    return new Response("No");
  },
  
  // АВТОПОСТИНГ (каждые 6 часов)
  async scheduled(event, env) {
    const hour = new Date().getUTCHours();
    
    if (hour === 6) {
      const topic = AUTO_TOPICS.invest[Math.floor(Math.random() * AUTO_TOPICS.invest.length)];
      const post = await generatePost(env, "invest", topic);
      await broadcastPost(env, post);
    }
    if (hour === 12) {
      const topic = AUTO_TOPICS.crypto[Math.floor(Math.random() * AUTO_TOPICS.crypto.length)];
      const post = await generatePost(env, "crypto", topic);
      await broadcastPost(env, post);
    }
    if (hour === 18) {
      const topic = AUTO_TOPICS.business[Math.floor(Math.random() * AUTO_TOPICS.business.length)];
      const post = await generatePost(env, "business", topic);
      await broadcastPost(env, post);
    }
  }
};

// === ОБРАБОТКА КНОПОК ===

async function handleCallback(env, chatId, data, msgId) {
  let reply = "";
  let kb = getBackKB();
  
  if (data === "invest_main") {
    reply = "💰 **ИНВЕСТИЦИИ**\n\nВыберите тему:";
    kb = getInvestKB();
  } else if (data === "crypto_main") {
    reply = "₿ **КРИПТОВАЛЮТЫ**\n\nВыберите:";
    kb = getCryptoKB();
  } else if (data === "business_main") {
    reply = "📊 **БИЗНЕС**\n\nВыберите:";
    kb = getBusinessKB();
  } else if (data === "learn_main") {
    reply = "📚 **ОБУЧЕНИЕ**\n\nБаза знаний:";
    kb = getLearnKB();
  } else if (data.startsWith("invest_")) {
    const topic = data.replace("invest_", "");
    reply = await investAnswer(env, "user", topic);
  } else if (data.startsWith("crypto_")) {
    const topic = data.replace("crypto_", "");
    reply = await cryptoAnswer(env, "user", topic);
  } else if (data.startsWith("business_")) {
    const topic = data.replace("business_", "");
    reply = await businessAnswer(env, "user", topic);
  } else if (data.startsWith("learn_")) {
    const topic = data.replace("learn_", "");
    reply = await learnTopic(env, "user", topic);
  } else {
    reply = "🔙 Меню";
    kb = getMainKB();
  }
  
  await sendKB(env, chatId, reply, kb, msgId);
}

// === КЛАВИАТУРЫ ===

function getMainKB() {
  return {inline_keyboard: [
    [{text:"💰 Инвестиции",callback_data:"invest_main"},{text:"₿ Крипта",callback_data:"crypto_main"}],
    [{text:"📊 Бизнес",callback_data:"business_main"},{text:"📚 Обучение",callback_data:"learn_main"}],
    [{text:"📰 Новости",callback_data:"news_main"},{text:"📖 Справка",callback_data:"help_main"}]
  ]};
}

function getInvestKB() {
  return {inline_keyboard: [
    [{text:"Акции",callback_data:"invest_Акции"},{text:"Облигации",callback_data:"invest_Облигации"}],
    [{text:"ETF",callback_data:"invest_ETF"},{text:"Дивиденды",callback_data:"invest_Дивиденды"}],
    [{text:"🔙 Назад",callback_data:"back_main"}]
  ]};
}

function getCryptoKB() {
  return {inline_keyboard: [
    [{text:"Биткоин",callback_data:"crypto_Биткоин"},{text:"Альткоины",callback_data:"crypto_Альткоины"}],
    [{text:"DeFi",callback_data:"crypto_DeFi"},{text:"NFT",callback_data:"crypto_NFT"}],
    [{text:"🔙 Назад",callback_data:"back_main"}]
  ]};
}

function getBusinessKB() {
  return {inline_keyboard: [
    [{text:"Стартап",callback_data:"business_Стартап"},{text:"Маркетинг",callback_data:"business_Маркетинг"}],
    [{text:"Франшиза",callback_data:"business_Франшиза"},{text:"🔙 Назад",callback_data:"back_main"}]
  ]};
}

function getLearnKB() {
  return {inline_keyboard: [
    [{text:"Инвестиции",callback_data:"learn_Инвестиции"},{text:"Крипта",callback_data:"learn_Крипта"}],
    [{text:"Бизнес",callback_data:"learn_Бизнес"},{text:"🔙 Назад",callback_data:"back_main"}]
  ]};
}

function getBackKB() {
  return {inline_keyboard: [[{text:"🔙 В меню",callback_data:"back_main"}]]};
}

function getHelpKB() {
  return {inline_keyboard: [[{text:"🔙 Меню",callback_data:"back_main"}]]};
}

async function sendKB(env, chatId, text, kb, msgId = null) {
  try {
    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({chat_id: chatId, text: text, parse_mode: "Markdown", reply_markup: JSON.stringify(kb), reply_to_message_id: msgId})
    });
  } catch(e) { console.error(e); }
}

function sendMsg(token, chatId, text) {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({chat_id: chatId, text: text, parse_mode: "Markdown"})
  }).then(r => r.json());
}

async function broadcastPost(env, text) {
  // Отправка в закрытый чат (нужно добавить бота в чат)
  try {
    await sendMsg(env.BOT_TOKEN, "-1001234567890", text); // Замените на ID чата
  } catch(e) { console.error("Broadcast error:", e); }
}

// === AI ФУНКЦИИ ===

async function investAnswer(env, userId, question) {
  const kb = KNOWLEDGE_BASE.investments.join("\n");
  const sys = `Ты инвестиционный консультант. Отвечай на русском. База: ${kb}`;
  const answer = await ai(env, sys + "\nВопрос: " + question);
  await saveLearn(env, userId, "invest", question, answer);
  return `💰 **ИНВЕСТИЦИИ**:\n\n${answer}`;
}

async function cryptoAnswer(env, userId, question) {
  const kb = KNOWLEDGE_BASE.crypto.join("\n");
  const sys = `Ты крипто-эксперт. Отвечай на русском. База: ${kb}`;
  const answer = await ai(env, sys + "\nВопрос: " + question);
  await saveLearn(env, userId, "crypto", question, answer);
  return `₿ **КРИПТО**:\n\n${answer}`;
}

async function businessAnswer(env, userId, question) {
  const kb = KNOWLEDGE_BASE.business.join("\n");
  const sys = `Ты бизнес-консультант. Отвечай на русском. База: ${kb}`;
  const answer = await ai(env, sys + "\nВопрос: " + question);
  await saveLearn(env, userId, "business", question, answer);
  return `📊 **БИЗНЕС**:\n\n${answer}`;
}

async function learnTopic(env, userId, topic) {
  const topics = {
    "Инвестиции": KNOWLEDGE_BASE.investments.join("\n\n"),
    "Крипта": KNOWLEDGE_BASE.crypto.join("\n\n"),
    "Бизнес": KNOWLEDGE_BASE.business.join("\n\n")
  };
  const content = topics[topic] || "Нет данных";
  await saveLearn(env, userId, "learn", topic, content);
  return `📚 **${topic}**:\n\n${content}`;
}

async function getMarketNews(env, userId) {
  const sys = "Дай краткий обзор рынков: акции, крипта, нефть, золото.";
  const answer = await ai(env, sys);
  return `📰 **РЫНКИ**:\n\n${answer}`;
}

async function generatePost(env, category, topic) {
  const prefixes = {invest:"💰", crypto:"₿", business:"📊"};
  const hashtags = {invest:"#Инвестиции #Финансы", crypto:"#Крипта #Биткоин", business:"#Бизнес #Стартап"};
  const sys = "Пост для Telegram. Заголовок с эмодзи, текст 500-800 символов, хэштеги.";
  const answer = await ai(env, sys + "\nТема: " + topic);
  return `${prefixes[category]} **{topic}**\n\n${answer}\n\n${hashtags[category]}`;
}

async function saveLearn(env, userId, category, question, answer) {
  try {
    const key = `learn_${category}_${Date.now()}`;
    await env.RAG_STORE.put(key, JSON.stringify({userId, category, question, answer, date: new Date().toISOString()}));
  } catch(e) { console.error(e); }
}

async function ai(env, text) {
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {"Authorization": "Bearer " + env.OPENROUTER_API_KEY, "Content-Type": "application/json"},
      body: JSON.stringify({model: "mistralai/mistral-7b-instruct:free", messages: [{role:"user",content:text}], max_tokens: 1000})
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "Не могу ответить";
  } catch(e) {
    return "Ошибка: " + e.message;
  }
}
