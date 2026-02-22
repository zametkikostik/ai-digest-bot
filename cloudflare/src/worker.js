/**
 * AI Digest Bot - INVESTMENT & CRYPTO EDITION
 * Автопостинг: Инвестиции, Бизнес, Криптовалюты
 * Канал: @investora_zametki
 */
const CHANNEL_ID = "-1001859702206"; // ai_world_russia
const INVEST_CHANNEL = "@investora_zametki"; // инвестиционный канал
const ADMIN_IDS = ["1271633868"];

// Темы для автопостинга
const INVEST_TOPICS = [
  "Топ-5 акций для покупки в 2026",
  "Как начать инвестировать с 1000₽",
  "Обзор ETF фондов для новичков",
  "Дивидендные стратегии",
  "Как оценить компанию перед покупкой акций",
  "Риски на фондовом рынке",
  "Пассивный доход: мифы и реальность",
  "Сложный процент: как работает",
  "ИИС vs брокерский счёт",
  "Облигации: стоит ли покупать"
];

const CRYPTO_TOPICS = [
  "Биткоин vs Золото: что выбрать",
  "Обзор альткоинов на 2026",
  "DeFi: заработок на ликвидности",
  "Стейкинг криптовалют: гайд",
  "NFT: стоит ли покупать",
  "Блокчейн технологии: применение",
  "Криптовалютные кошельки: виды",
  "Трейдинг: стратегии для новичков",
  "Анализ рынка криптовалют",
  "Регулирование крипторынка"
];

const BUSINESS_TOPICS = [
  "Как открыть стартап с нуля",
  "Бизнес-модель Canvas: разбор",
  "Франшиза vs свой бренд",
  "Маркетинг для малого бизнеса",
  "Как найти первых клиентов",
  "Бизнес-план: структура",
  "Инвестиции в стартапы",
  "Масштабирование бизнеса",
  "Онлайн бизнес: идеи 2026",
  "Бухгалтерия для ИП и ООО"
];

// База знаний (самообучение)
const KNOWLEDGE_BASE = {
  investments: [
    "Акции — доля владения компанией. Покупая акции, вы становитесь совладельцем.",
    "Облигации — долговые бумаги. Вы даёте в долг компании/государству под процент.",
    "ETF — биржевой фонд, который повторяет индекс (например, S&P 500).",
    "Дивиденды — часть прибыли компании, которую выплачивают акционерам.",
    "ИИС — индивидуальный инвестиционный счёт с налоговыми льготами в РФ."
  ],
  crypto: [
    "Биткоин — первая криптовалюта, создана в 2009 году Сатоши Накамото.",
    "Блокчейн — распределённая база данных, лежащая в основе криптовалют.",
    "DeFi — децентрализованные финансы на базе смарт-контрактов.",
    "Стейкинг — заработок на хранении криптовалюты в Proof-of-Stake сетях.",
    "NFT — уникальный токен, представляющий право на цифровой актив."
  ],
  business: [
    "Стартап — компания в поиске повторяемой и масштабируемой бизнес-модели.",
    "Бизнес-модель Canvas — инструмент описания бизнеса из 9 блоков.",
    "Франшиза — право использовать бренд и бизнес-модель за роялти.",
    "MVP — минимально жизнеспособный продукт для проверки гипотез.",
    "Unit-экономика — расчёт экономики одного клиента/продукта."
  ]
};

export default {
  async fetch(request, env) {
    if (request.method === "GET") return new Response("Investment Bot OK");
    
    if (request.method === "POST") {
      const update = await request.json();
      
      if (update.callback_query) {
        const cb = update.callback_query;
        await handleCallback(env, cb.message.chat.id, cb.data, cb.message.message_id);
        return new Response("OK");
      }
      
      if (update.message) {
        const msg = update.message;
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const name = msg.from?.first_name || "User";
        const uid = msg.from?.id?.toString();
        const chatType = msg.chat.type;
        
        if ((chatType === "group" || chatType === "supergroup") && !text.includes("@AidenHelpbot")) {
          return new Response("OK");
        }
        
        let reply = "";
        
        if (text === "/start") {
          reply = `👋 Привет, ${name}!

Я — **Aiden INVEST**, твой AI-помощник по инвестициям.

💰 **ТЕМЫ:**
• Инвестиции и акции
• Криптовалюты и DeFi
• Бизнес и стартапы

📋 **КОМАНДЫ:**
/invest [вопрос] — про инвестиции
/crypto [вопрос] — про крипту
/business [вопрос] — про бизнес
/learn [тема] — обучение
/portfolio — мой портфель
/news — новости рынка

**Жми кнопки!** 👇`;
          await sendKB(env, chatId, reply, getMainKB());
          return new Response("OK");
        }
        
        if (text === "/help") {
          reply = `📖 **СПРАВКА:**

**Инвестиции:**
/invest Акции — про акции
/invest Облигации — про облигации

**Крипта:**
/crypto Биткоин — про BTC
/crypto DeFi — про DeFi

**Бизнес:**
/business Стартап — про стартапы

**Обучение:**
/learn Инвестиции — база
/learn Крипта — база

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
        } else if (text === "/portfolio") {
          reply = "📊 **ПОРТФЕЛЬ**\n\nФункция в разработке. Скоро!";
        } else if (text === "/news") {
          reply = await getMarketNews(env, uid);
        } else if (text.startsWith("/ask ")) {
          reply = await ai(env, text.replace("/ask ", ""));
        } else if (text.startsWith("/")) {
          reply = "❓ /help";
        } else {
          reply = await ai(env, text);
        }
        
        if (reply) await sendMsg(env.BOT_TOKEN, chatId, reply);
      }
      
      return new Response("OK");
    }
    
    return new Response("No");
  },
  
  // АВТОПОСТИНГ
  async scheduled(event, env) {
    const hour = new Date().getUTCHours();
    const day = new Date().getUTCDay();
    
    // 9:00 UTC — Инвестиции (понедельник, среда, пятница)
    if (hour === 9 && [1, 3, 5].includes(day)) {
      const topic = INVEST_TOPICS[Math.floor(Math.random() * INVEST_TOPICS.length)];
      const post = await generateInvestPost(env, topic);
      await sendMsg(env.BOT_TOKEN, CHANNEL_ID, post);
      console.log(`Invest post: ${topic}`);
    }
    
    // 12:00 UTC — Криптовалюты (вторник, четверг)
    if (hour === 12 && [2, 4].includes(day)) {
      const topic = CRYPTO_TOPICS[Math.floor(Math.random() * CRYPTO_TOPICS.length)];
      const post = await generateCryptoPost(env, topic);
      await sendMsg(env.BOT_TOKEN, CHANNEL_ID, post);
      console.log(`Crypto post: ${topic}`);
    }
    
    // 15:00 UTC — Бизнес (понедельник, четверг)
    if (hour === 15 && [1, 4].includes(day)) {
      const topic = BUSINESS_TOPICS[Math.floor(Math.random() * BUSINESS_TOPICS.length)];
      const post = await generateBusinessPost(env, topic);
      await sendMsg(env.BOT_TOKEN, CHANNEL_ID, post);
      console.log(`Business post: ${topic}`);
    }
    
    // 18:00 UTC — Дайджест (ежедневно)
    if (hour === 18) {
      const digest = await generateDailyDigest(env);
      await sendMsg(env.BOT_TOKEN, CHANNEL_ID, digest);
      console.log("Daily digest posted");
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
  const sys = "Ты финансовый аналитик. Дай краткий обзор рынков: акции, крипта, нефть, золото.";
  const answer = await ai(env, sys);
  return `📰 **РЫНКИ**:\n\n${answer}`;
}

async function generateInvestPost(env, topic) {
  const sys = "Создай пост для Telegram канала про инвестиции. Заголовок с эмодзи, текст 500-800 символов, 3-5 хэштегов, призыв к действию.";
  const answer = await ai(env, sys + "\nТема: " + topic);
  return `💰 **{topic}**\n\n${answer}\n\n#Инвестиции #Финансы`;
}

async function generateCryptoPost(env, topic) {
  const sys = "Создай пост про криптовалюты. Заголовок с эмодзи, текст, хэштеги.";
  const answer = await ai(env, sys + "\nТема: " + topic);
  return `₿ **{topic}**\n\n${answer}\n\n#Крипта #Биткоин`;
}

async function generateBusinessPost(env, topic) {
  const sys = "Создай пост про бизнес. Заголовок, текст, хэштеги.";
  const answer = await ai(env, sys + "\nТема: " + topic);
  return `📊 **{topic}**\n\n${answer}\n\n#Бизнес #Стартап`;
}

async function generateDailyDigest(env) {
  const sys = "Дайджест рынков за день: акции, крипта, нефть, золото. Кратко, по делу.";
  const answer = await ai(env, sys);
  return `📰 **ДАЙДЖЕСТ**\n${new Date().toLocaleDateString('ru-RU')}\n\n${answer}`;
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
