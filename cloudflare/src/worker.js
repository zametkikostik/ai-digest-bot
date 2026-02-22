/**
 * AI Digest Bot - FAST INVESTMENT (мгновенные кнопки)
 */
const ADMIN_IDS = ["1271633868"];

// МГНОВЕННЫЕ ОТВЕТЫ (без AI)
const QUICK_ANSWERS = {
  "invest_Акции": "💰 **АКЦИИ**\n\nАкция — доля в компании.\n\n📈 **Плюсы:**\n• Рост стоимости\n• Дивиденды\n• Ликвидность\n\n⚠️ **Риски:**\n• Волатильность\n• Банкротство компании\n\nНапиши /invest Акции для деталей!",
  
  "invest_Облигации": "💰 **ОБЛИГАЦИИ**\n\nОблигация — долговая бумага.\n\n📈 **Плюсы:**\n• Стабильный купон\n• Возврат номинала\n• Меньше риск\n\n⚠️ **Минусы:**\n• Меньше доходность\n• Инфляционный риск",
  
  "invest_ETF": "💰 **ETF**\n\nETF — биржевой фонд.\n\n📈 **Плюсы:**\n• Диверсификация\n• Низкие комиссии\n• Простота\n\n⚠️ **Минусы:**\n• Комиссия фонда\n• Нет контроля",
  
  "invest_Дивиденды": "💰 **ДИВИДЕНДЫ**\n\nЧасть прибыли акционерам.\n\n📈 **Стратегия:**\n• Акции дивидендных аристократов\n• Реинвестирование\n• Сложный процент",
  
  "crypto_Биткоин": "₿ **БИТКОИН**\n\nПервая криптовалюта (2009).\n\n📈 **Плюсы:**\n• Ограниченная эмиссия (21M)\n• Децентрализация\n• Защита от инфляции\n\n⚠️ **Риски:**\n• Волатильность\n• Регулирование",
  
  "crypto_Альткоины": "₿ **АЛЬТКОИНЫ**\n\nВсе крипты кроме BTC.\n\n📈 **Популярные:**\n• Ethereum (ETH)\n• Solana (SOL)\n• BNB\n\n⚠️ **Риски:**\n• Высокая волатильность\n• Меньше ликвидность",
  
  "crypto_DeFi": "₿ **DEFI**\n\nДецентрализованные финансы.\n\n📈 **Возможности:**\n• Стейкинг\n• Ликвидность\n• Лендинг\n\n⚠️ **Риски:**\n• Смарт-контракты\n• Rug pulls",
  
  "crypto_NFT": "₿ **NFT**\n\nУникальный токен.\n\n📈 **Применение:**\n• Искусство\n• Коллекции\n• Игры\n\n⚠️ **Риски:**\n• Ликвидность\n• Спекуляции",
  
  "business_Стартап": "📊 **СТАРТАП**\n\nКомпания в поиске модели.\n\n📈 **Этапы:**\n• Идея\n• MVP\n• Product-Market Fit\n• Масштабирование\n\n⚠️ **Риски:**\n• 90% неудач\n• Конкуренция",
  
  "business_Маркетинг": "📊 **МАРКЕТИНГ**\n\nПродвижение продукта.\n\n📈 **Каналы:**\n• Соцсети\n• Контент\n• Реклама\n• SEO\n\n⚠️ **Важно:**\n• Целевая аудитория\n• Unit-экономика",
  
  "business_Франшиза": "📊 **ФРАНШИЗА**\n\nГотовая бизнес-модель.\n\n📈 **Плюсы:**\n• Готовый бренд\n• Поддержка\n• Меньше риск\n\n⚠️ **Минусы:**\n• Роялти\n• Меньше свободы",
  
  "learn_Инвестиции": "📚 **ИНВЕСТИЦИИ — БАЗА**\n\n1️⃣ **Акции** — доля в компании\n2️⃣ **Облигации** — долг под процент\n3️⃣ **ETF** — диверсификация\n4️⃣ **Дивиденды** — пассивный доход\n5️⃣ **ИИС** — налоговые льготы\n\n/learn Крипта — дальше",
  
  "learn_Крипта": "📚 **КРИПТА — БАЗА**\n\n1️⃣ **Биткоин** — цифровое золото\n2️⃣ **Блокчейн** — распределённая база\n3️⃣ **DeFi** — децентрализованные финансы\n4️⃣ **Стейкинг** — пассивный доход\n5️⃣ **NFT** — уникальные токены\n\n/learn Бизнес — дальше",
  
  "learn_Бизнес": "📚 **БИЗНЕС — БАЗА**\n\n1️⃣ **Стартап** — поиск модели\n2️⃣ **MVP** — проверка гипотез\n3️⃣ **Canvas** — 9 блоков модели\n4️⃣ **Unit-экономика** — расчёт клиента\n5️⃣ **Франшиза** — готовый бизнес",
  
  "news_main": "📰 **НОВОСТИ РЫНКОВ**\n\nИспользуй /news для получения актуальных новостей!",
  
  "help_main": "📖 **СПРАВКА**\n\n**Команды:**\n/invest [вопрос] — инвестиции\n/crypto [вопрос] — крипта\n/business [вопрос] — бизнес\n/learn [тема] — обучение\n/news — новости\n\n**Кнопки:**\nЖми на категории выше!"
};

// Инфляция (кэш)
const INFLATION = {
  "Россия":"7.5% 📈","США":"3.2% 📉","Болгария":"4.8% ➡️",
  "Германия":"2.9% 📉","Китай":"2.1% ➡️","ЕС":"2.9% 📉"
};

export default {
  async fetch(request, env) {
    if (request.method === "GET") return new Response("Fast Invest Bot OK");
    
    if (request.method === "POST") {
      const update = await request.json();
      
      // Кнопки — МГНОВЕННО
      if (update.callback_query) {
        const cb = update.callback_query;
        const data = cb.data;
        const chatId = cb.message.chat.id;
        const msgId = cb.message.message_id;
        
        let reply = "";
        let kb = null;
        
        // Мгновенные ответы из кэша
        if (QUICK_ANSWERS[data]) {
          reply = QUICK_ANSWERS[data];
          kb = getBackKB();
        } else if (data === "back_main" || data === "invest_main" || data === "crypto_main" || data === "business_main" || data === "learn_main") {
          reply = "🔙 Меню";
          kb = getMainKB();
        } else if (data.startsWith("inflation_")) {
          const country = data.replace("inflation_", "");
          reply = `📊 **{country}**: ${INFLATION[country] || "N/A"}`;
          kb = getBackKB();
        } else {
          reply = "🔙 Меню";
          kb = getMainKB();
        }
        
        if (reply) await sendKB(env, chatId, reply, kb, msgId);
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
        
        const isGroup = chatType === "group" || chatType === "supergroup";
        if (isGroup && !text.startsWith("/") && !text.includes("@AidenHelpbot")) {
          return new Response("OK");
        }
        
        let reply = "";
        
        if (text === "/start") {
          reply = `👋 Привет, ${name}!

Я — **Aiden Invest**, твой AI-помощник.

💰 Инвестиции
₿ Криптовалюты
📊 Бизнес

**Жми кнопки!** 👇`;
          await sendKB(env, chatId, reply, getMainKB());
          return new Response("OK");
        }
        
        if (text === "/help") {
          reply = "📖 **СПРАВКА**\n\n/invest [вопрос]\n/crypto [вопрос]\n/business [вопрос]\n/learn [тема]\n/news";
          await sendKB(env, chatId, reply, getHelpKB());
          return new Response("OK");
        }
        
        // AI только для команд с вопросами
        if (text.startsWith("/invest ")) {
          reply = await ai(env, "Ты инвестиционный консультант. " + text.replace("/invest ", ""));
        } else if (text.startsWith("/crypto ")) {
          reply = await ai(env, "Ты крипто-эксперт. " + text.replace("/crypto ", ""));
        } else if (text.startsWith("/business ")) {
          reply = await ai(env, "Ты бизнес-консультант. " + text.replace("/business ", ""));
        } else if (text.startsWith("/learn ")) {
          const t = text.replace("/learn ", "");
          reply = QUICK_ANSWERS["learn_" + t] || await ai(env, "Обучение: " + t);
        } else if (text === "/news") {
          reply = await ai(env, "Новости рынков: акции, крипта, нефть, золото. Кратко.");
        } else if (text.startsWith("/ask ")) {
          reply = await ai(env, text.replace("/ask ", ""));
        } else if (text.startsWith("/")) {
          reply = "❓ /help";
        } else if (text.includes("@AidenHelpbot")) {
          reply = await ai(env, text.replace("@AidenHelpbot", ""));
        } else {
          return new Response("OK");
        }
        
        if (reply) await sendMsg(env.BOT_TOKEN, chatId, reply);
      }
      
      return new Response("OK");
    }
    
    return new Response("No");
  },
  
  async scheduled(event, env) {
    const h = new Date().getUTCHours();
    if (h === 9) await sendMsg(env.BOT_TOKEN, "-1001234567890", await ai(env, "Пост про инвестиции"));
    if (h === 15) await sendMsg(env.BOT_TOKEN, "-1001234567890", await ai(env, "Пост про крипту"));
  }
};

// === КЛАВИАТУРЫ ===

function getMainKB() {
  return {inline_keyboard: [
    [{text:"💰 Инвестиции",callback_data:"invest_main"},{text:"₿ Крипта",callback_data:"crypto_main"}],
    [{text:"📊 Бизнес",callback_data:"business_main"},{text:"📚 Обучение",callback_data:"learn_main"}],
    [{text:"📊 Инфляция",callback_data:"inflation_main"},{text:"📰 Новости",callback_data:"news_main"}],
    [{text:"📖 Справка",callback_data:"help_main"}]
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

function getInflationKB() {
  return {inline_keyboard: [
    [{text:"🇷🇺 Россия",callback_data:"inflation_Россия"},{text:"🇺🇸 США",callback_data:"inflation_США"}],
    [{text:"🇧🇬 Болгария",callback_data:"inflation_Болгария"},{text:"🇩🇪 Германия",callback_data:"inflation_Германия"}],
    [{text:"🔙 Назад",callback_data:"back_main"}]
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

async function ai(env, text) {
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {"Authorization": "Bearer " + env.OPENROUTER_API_KEY, "Content-Type": "application/json"},
      body: JSON.stringify({model: "mistralai/mistral-7b-instruct:free", messages: [{role:"user",content:text}], max_tokens: 800})
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "Не могу ответить";
  } catch(e) {
    return "Ошибка: " + e.message;
  }
}
