/**
 * AI Digest Bot - MAXIMUM UNIVERSAL EDITION
 * Все сферы + Многоуровневые кнопки + Быстрые ответы
 * Для разной аудитории: Школьники, Студенты, Инвесторы, Предприниматели
 */
const CHANNEL_ID = "-1001859702206";
const ADMIN_IDS = ["1271633868"];

// === БАЗА ЗНАНИЙ (кэшированные ответы для кнопок) ===
const KNOWLEDGE = {
  // ИНВЕСТИЦИИ
  "invest_Акции": "💰 **АКЦИИ**\n\nАкция — доля в компании.\n\n📈 **Плюсы:**\n• Рост стоимости\n• Дивиденды\n• Ликвидность\n\n⚠️ **Риски:**\n• Волатильность\n• Банкротство\n\n📚 **Популярные:**\n• Apple (AAPL)\n• Tesla (TSLA)\n• Газпром (GAZP)\n\nНапиши /invest Акции для деталей!",
  
  "invest_Облигации": "💰 **ОБЛИГАЦИИ**\n\nДолговая бумага.\n\n📈 **Плюсы:**\n• Купонный доход\n• Возврат номинала\n• Меньше риск\n\n⚠️ **Минусы:**\n• Меньше доходность\n• Инфляционный риск\n\n📚 **Виды:**\n• ОФЗ (гос.)\n• Корпоративные\n• Муниципальные",
  
  "invest_ETF": "💰 **ETF**\n\nБиржевой фонд.\n\n📈 **Плюсы:**\n• Диверсификация\n• Низкие комиссии\n• Простота\n\n⚠️ **Минусы:**\n• Комиссия фонда\n• Нет контроля\n\n📚 **Популярные:**\n• S&P 500 (VOO)\n• Nasdaq (QQQ)\n• Золото (GLD)",
  
  "invest_Дивиденды": "💰 **ДИВИДЕНДЫ**\n\nЧасть прибыли акционерам.\n\n📈 **Стратегия:**\n• Дивидендные аристократы\n• Реинвестирование\n• Сложный процент\n\n📚 **Топ РФ:**\n• Лукойл\n• Сбербанк\n• Газпром",
  
  // КРИПТОВАЛЮТЫ
  "crypto_Биткоин": "₿ **БИТКОИН**\n\nПервая криптовалюта (2009).\n\n📈 **Плюсы:**\n• Лимит 21 млн\n• Децентрализация\n• Защита от инфляции\n\n⚠️ **Риски:**\n• Волатильность\n• Регулирование\n\n📊 **Текущая цена:** $95,000+",
  
  "crypto_Альткоины": "₿ **АЛЬТКОИНЫ**\n\nВсе крипты кроме BTC.\n\n📈 **Топ-5:**\n1. Ethereum (ETH)\n2. Solana (SOL)\n3. BNB\n4. XRP\n5. Cardano (ADA)\n\n⚠️ **Риски:**\n• Высокая волатильность",
  
  "crypto_DeFi": "₿ **DEFI**\n\nДецентрализованные финансы.\n\n📈 **Возможности:**\n• Стейкинг (5-20%)\n• Ликвидность\n• Лендинг\n\n⚠️ **Риски:**\n• Смарт-контракты\n• Rug pulls\n\n📚 **Платформы:**\n• Uniswap\n• Aave\n• Compound",
  
  "crypto_NFT": "₿ **NFT**\n\nУникальный токен.\n\n📈 **Применение:**\n• Искусство\n• Коллекции\n• Игры\n• Метавселенные\n\n⚠️ **Риски:**\n• Ликвидность\n• Спекуляции",
  
  // БИЗНЕС
  "business_Стартап": "📊 **СТАРТАП**\n\nКомпания в поиске модели.\n\n📈 **Этапы:**\n1. Идея\n2. MVP\n3. Product-Market Fit\n4. Масштабирование\n\n⚠️ **Статистика:**\n• 90% неудач\n• 5 лет до успеха\n\n📚 **Источники:**\n• Ангелы\n• VC фонды\n• Гранты",
  
  "business_Маркетинг": "📊 **МАРКЕТИНГ**\n\nПродвижение продукта.\n\n📈 **Каналы:**\n• Соцсети (SMM)\n• Контент-маркетинг\n• Реклама (PPC)\n• SEO\n• Email\n\n⚠️ **Важно:**\n• Целевая аудитория\n• Unit-экономика\n• Воронка продаж",
  
  "business_Франшиза": "📊 **ФРАНШИЗА**\n\nГотовая бизнес-модель.\n\n📈 **Плюсы:**\n• Готовый бренд\n• Поддержка\n• Меньше риск\n\n⚠️ **Минусы:**\n• Роялти (5-10%)\n• Паушальный взнос\n• Меньше свободы\n\n📚 **Популярные:**\n• McDonald's\n• Subway\n• Пятёрочка",
  
  // ОБУЧЕНИЕ
  "learn_Инвестиции": "📚 **ИНВЕСТИЦИИ — БАЗА**\n\n1️⃣ **Акции** — доля в компании\n2️⃣ **Облигации** — долг под %\n3️⃣ **ETF** — диверсификация\n4️⃣ **Дивиденды** — пассивный доход\n5️⃣ **ИИС** — льготы РФ\n\n💡 **С чего начать:**\n1. Подушка безопасности\n2. Брокерский счёт\n3. ETF на индекс\n4. Реинвестирование",
  
  "learn_Крипта": "📚 **КРИПТА — БАЗА**\n\n1️⃣ **Биткоин** — цифровое золото\n2️⃣ **Блокчейн** — распределённая база\n3️⃣ **DeFi** — децентрализованные финансы\n4️⃣ **Стейкинг** — пассивный доход\n5️⃣ **NFT** — уникальные токены\n\n💡 **С чего начать:**\n1. Изучи основы\n2. Купи немного BTC\n3. Используй холодный кошелёк\n4. DCA стратегия",
  
  "learn_Бизнес": "📚 **БИЗНЕС — БАЗА**\n\n1️⃣ **Стартап** — поиск модели\n2️⃣ **MVP** — проверка гипотез\n3️⃣ **Canvas** — 9 блоков\n4️⃣ **Unit-экономика** — расчёт\n5️⃣ **Франшиза** — готовый бизнес\n\n💡 **С чего начать:**\n1. Найди проблему\n2. Проверь спрос\n3. Создай MVP\n4. Найди первых клиентов",
  
  // ШКОЛА
  "school_Математика": "🏫 **МАТЕМАТИКА**\n\n📚 **Темы:**\n• Алгебра\n• Геометрия\n• Тригонометрия\n• Производные\n• Интегралы\n\n💡 **Напиши задачу** — решу пошагово!",
  
  "school_Физика": "🏫 **ФИЗИКА**\n\n📚 **Темы:**\n• Механика\n• Электричество\n• Оптика\n• Термодинамика\n• Квантовая\n\n💡 **Задай вопрос** — объясню!",
  
  "school_Химия": "🏫 **ХИМИЯ**\n\n📚 **Темы:**\n• Органическая\n• Неорганическая\n• Реакции\n• Расчёты\n\n💡 **Спроси** — помогу!",
  
  // ЯЗЫКИ
  "lang_Английский": "🔤 **АНГЛИЙСКИЙ**\n\n📚 **Уровни:**\n• A1-A2 (Beginner)\n• B1-B2 (Intermediate)\n• C1-C2 (Advanced)\n\n💡 **Напиши:**\n• /translate [текст]\n• Слово для перевода",
  
  "lang_Немецкий": "🔤 **НЕМЕЦКИЙ**\n\n📚 **Уровни:**\n• A1-C2\n\n💡 **Напиши текст** — переведу!",
  
  // IT
  "it_Python": "💻 **PYTHON**\n\n📚 **Применение:**\n• Веб (Django, FastAPI)\n• Data Science\n• AI/ML\n• Автоматизация\n\n💡 **Напиши задачу** — создам код!",
  
  "it_JS": "💻 **JAVASCRIPT**\n\n📚 **Применение:**\n• Веб-фронтенд\n• Node.js (бэкенд)\n• React, Vue\n• Мобильные (React Native)\n\n💡 **Задай вопрос** — помогу!",
  
  "it_Solidity": "💻 **SOLIDITY**\n\n📚 **Применение:**\n• Смарт-контракты\n• DeFi\n• NFT\n• DAO\n\n💡 **Опиши контракт** — напишу!",
  
  // НОВОСТИ
  "news_Мир": "🌍 **НОВОСТИ МИРА**\n\nИспользуй /news Мир для актуальных новостей!",
  
  "news_Технологии": "💻 **НОВОСТИ IT**\n\nИспользуй /news Технологии!",
  
  "news_Бизнес": "📊 **НОВОСТИ БИЗНЕСА**\n\nИспользуй /news Бизнес!",
  
  // ИНФЛЯЦИЯ
  "inflation_Россия": "📊 **РОССИЯ**\n\n💹 Инфляция: **7.5%** 📈\n\n📉 **Ключевая ставка:** 16%\n💰 **ВВП рост:** +2.1%",
  
  "inflation_США": "📊 **США**\n\n💹 Инфляция: **3.2%** 📉\n\n📉 **Ставка ФРС:** 5.5%\n💰 **ВВП рост:** +2.5%",
  
  "inflation_Болгария": "📊 **БОЛГАРИЯ**\n\n💹 Инфляция: **4.8%** ➡️\n\n📉 **Ставка:** 5.5%\n💰 **ВВП рост:** +3.2%",
  
  "inflation_Германия": "📊 **ГЕРМАНИЯ**\n\n💹 Инфляция: **2.9%** 📉\n\n📉 **Ставка ЕЦБ:** 4.5%\n💰 **ВВП рост:** +0.5%",
  
  "inflation_Китай": "📊 **КИТАЙ**\n\n💹 Инфляция: **2.1%** ➡️\n\n📉 **Ставка:** 3.45%\n💰 **ВВП рост:** +5.2%",
  
  "inflation_ЕС": "📊 **ЕВРОСОЮЗ**\n\n💹 Инфляция: **2.9%** 📉\n\n📉 **Ставка ЕЦБ:** 4.5%\n💰 **ВВП рост:** +0.8%"
};

// === АУДИТОРИИ ===
const AUDIENCES = {
  "Школьники": ["school_Математика", "school_Физика", "school_Химия", "lang_Английский"],
  "Студенты": ["learn_Инвестиции", "it_Python", "it_JS", "lang_Английский"],
  "Инвесторы": ["invest_Акции", "invest_ETF", "crypto_Биткоин", "inflation_Россия"],
  "Предприниматели": ["business_Стартап", "business_Маркетинг", "learn_Бизнес", "it_Python"]
};

export default {
  async fetch(request, env) {
    if (request.method === "GET") return new Response("AI Digest Bot PRO");
    
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
        if (KNOWLEDGE[data]) {
          reply = KNOWLEDGE[data];
          kb = getBackKB();
        } else if (data === "back_main") {
          reply = "🔙 **Главное меню**";
          kb = getMainKB();
        } else if (data === "invest_main") {
          reply = "💰 **ИНВЕСТИЦИИ**\n\nВыберите тему:";
          kb = getInvestKB();
        } else if (data === "crypto_main") {
          reply = "₿ **КРИПТОВАЛЮТЫ**\n\nВыберите:";
          kb = getCryptoKB();
        } else if (data === "business_main") {
          reply = "📊 **БИЗНЕС**\n\nВыберите:";
          kb = getBusinessKB();
        } else if (data === "learn_main") {
          reply = "📚 **ОБУЧЕНИЕ**\n\nВыберите:";
          kb = getLearnKB();
        } else if (data === "school_main") {
          reply = "🏫 **ШКОЛА**\n\nВыберите предмет:";
          kb = getSchoolKB();
        } else if (data === "lang_main") {
          reply = "🔤 **ЯЗЫКИ**\n\nВыберите:";
          kb = getLangKB();
        } else if (data === "it_main") {
          reply = "💻 **IT**\n\nВыберите:";
          kb = getItKB();
        } else if (data === "news_main") {
          reply = "📰 **НОВОСТИ**\n\nВыберите:";
          kb = getNewsKB();
        } else if (data === "inflation_main") {
          reply = "📊 **ИНФЛЯЦИЯ**\n\nВыберите страну:";
          kb = getInflationKB();
        } else if (data.startsWith("inflation_")) {
          const country = data.replace("inflation_", "");
          reply = KNOWLEDGE[data] || "❌ Нет данных";
          kb = getBackKB();
        } else if (data === "audience_school") {
          reply = "🏫 **ШКОЛЬНИКАМ**\n\nМатематика, физика, химия, языки.\n\nВыберите предмет:";
          kb = getSchoolKB();
        } else if (data === "audience_student") {
          reply = "🎓 **СТУДЕНТАМ**\n\nВышмат, программирование, инвестиции.\n\nВыберите:";
          kb = getLearnKB();
        } else if (data === "audience_investor") {
          reply = "💰 **ИНВЕСТОРАМ**\n\nАкции, облигации, крипта.\n\nВыберите:";
          kb = getInvestKB();
        } else if (data === "audience_business") {
          reply = "📊 **ПРЕДПРИНИМАТЕЛЯМ**\n\nСтартап, маркетинг, бизнес.\n\nВыберите:";
          kb = getBusinessKB();
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

Я — **Aiden PRO**, максимально универсальный AI-помощник.

🎯 **ВЫБЕРИ СЕБЯ:**

🏫 **Школьникам** — математика, физика, химия
🎓 **Студентам** — вышмат, код, инвестиции
💰 **Инвесторам** — акции, крипта, анализ
📊 **Предпринимателям** — стартап, маркетинг

📚 **ВСЕ РАЗДЕЛЫ:**
💻 IT и программирование
🔤 Иностранные языки
📰 Новости и аналитика
📊 Инфляция стран

**Жми кнопки!** 👇`;
          await sendKB(env, chatId, reply, getMainKB());
          return new Response("OK");
        }
        
        if (text === "/help") {
          reply = `📖 **СПРАВКА:**

**🎯 Аудитории:**
/audience — выбрать себя

**💰 Инвестиции:**
/invest [вопрос]

**₿ Крипта:**
/crypto [вопрос]

**📊 Бизнес:**
/business [вопрос]

**💻 IT:**
/code [задача]

**🏫 Школа:**
/solve [задача]

**🔤 Языки:**
/translate [текст]

**📰 Новости:**
/news [категория]

**Кнопки внизу!**`;
          await sendKB(env, chatId, reply, getHelpKB());
          return new Response("OK");
        }
        
        if (text === "/audience") {
          reply = "🎯 **ВЫБЕРИ СЕБЯ**\n\nКто ты?";
          await sendKB(env, chatId, reply, getAudienceKB());
          return new Response("OK");
        }
        
        // AI только для вопросов
        if (text.startsWith("/invest ")) {
          reply = await ai(env, "Ты инвестиционный консультант. " + text.replace("/invest ", ""));
        } else if (text.startsWith("/crypto ")) {
          reply = await ai(env, "Ты крипто-эксперт. " + text.replace("/crypto ", ""));
        } else if (text.startsWith("/business ")) {
          reply = await ai(env, "Ты бизнес-консультант. " + text.replace("/business ", ""));
        } else if (text.startsWith("/code ")) {
          reply = await ai(env, "Ты программист. Напиши код: " + text.replace("/code ", ""));
        } else if (text.startsWith("/solve ")) {
          reply = await ai(env, "Реши задачу: " + text.replace("/solve ", ""));
        } else if (text.startsWith("/translate ")) {
          reply = await ai(env, "Переведи: " + text.replace("/translate ", ""));
        } else if (text.startsWith("/news ")) {
          reply = await ai(env, "Новости: " + text.replace("/news ", ""));
        } else if (text.startsWith("/ask ")) {
          reply = await ai(env, text.replace("/ask ", ""));
        } else if (text.startsWith("/")) {
          reply = "❓ Неизвестная команда. /help";
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
    if (h === 9) await sendMsg(env.BOT_TOKEN, CHANNEL_ID, await ai(env, "Пост про инвестиции"));
    if (h === 15) await sendMsg(env.BOT_TOKEN, CHANNEL_ID, await ai(env, "Пост про крипту"));
    if (h === 18) await sendMsg(env.BOT_TOKEN, CHANNEL_ID, await ai(env, "Дайджест за день"));
  }
};

// === КЛАВИАТУРЫ ===

function getMainKB() {
  return {inline_keyboard: [
    [{text:"🎯 Кто ты?",callback_data:"audience_main"}],
    [{text:"💰 Инвестиции",callback_data:"invest_main"},{text:"₿ Крипта",callback_data:"crypto_main"}],
    [{text:"📊 Бизнес",callback_data:"business_main"},{text:"📚 Обучение",callback_data:"learn_main"}],
    [{text:"💻 IT",callback_data:"it_main"},{text:"🔤 Языки",callback_data:"lang_main"}],
    [{text:"🏫 Школа",callback_data:"school_main"},{text:"📰 Новости",callback_data:"news_main"}],
    [{text:"📊 Инфляция",callback_data:"inflation_main"},{text:"📖 Справка",callback_data:"help_main"}]
  ]};
}

function getAudienceKB() {
  return {inline_keyboard: [
    [{text:"🏫 Школьник",callback_data:"audience_school"},{text:"🎓 Студент",callback_data:"audience_student"}],
    [{text:"💰 Инвестор",callback_data:"audience_investor"},{text:"📊 Предприниматель",callback_data:"audience_business"}],
    [{text:"🔙 Назад",callback_data:"back_main"}]
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

function getSchoolKB() {
  return {inline_keyboard: [
    [{text:"Математика",callback_data:"school_Математика"},{text:"Физика",callback_data:"school_Физика"}],
    [{text:"Химия",callback_data:"school_Химия"},{text:"🔙 Назад",callback_data:"back_main"}]
  ]};
}

function getLangKB() {
  return {inline_keyboard: [
    [{text:"Английский",callback_data:"lang_Английский"},{text:"Немецкий",callback_data:"lang_Немецкий"}],
    [{text:"🔙 Назад",callback_data:"back_main"}]
  ]};
}

function getItKB() {
  return {inline_keyboard: [
    [{text:"Python",callback_data:"it_Python"},{text:"JavaScript",callback_data:"it_JS"}],
    [{text:"Solidity",callback_data:"it_Solidity"},{text:"🔙 Назад",callback_data:"back_main"}]
  ]};
}

function getNewsKB() {
  return {inline_keyboard: [
    [{text:"Мир",callback_data:"news_Мир"},{text:"Технологии",callback_data:"news_Технологии"}],
    [{text:"Бизнес",callback_data:"news_Бизнес"},{text:"🔙 Назад",callback_data:"back_main"}]
  ]};
}

function getInflationKB() {
  return {inline_keyboard: [
    [{text:"🇷🇺 Россия",callback_data:"inflation_Россия"},{text:"🇺🇸 США",callback_data:"inflation_США"}],
    [{text:"🇧🇬 Болгария",callback_data:"inflation_Болгария"},{text:"🇩🇪 Германия",callback_data:"inflation_Германия"}],
    [{text:"🇨🇳 Китай",callback_data:"inflation_Китай"},{text:"🇪🇺 ЕС",callback_data:"inflation_ЕС"}],
    [{text:"🔙 Назад",callback_data:"back_main"}]
  ]};
}

function getBackKB() {
  return {inline_keyboard: [[{text:"🔙 В главное меню",callback_data:"back_main"}]]};
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
      body: JSON.stringify({model: "mistralai/mistral-7b-instruct:free", messages: [{role:"user",content:text}], max_tokens: 1000})
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "Не могу ответить";
  } catch(e) {
    return "Ошибка: " + e.message;
  }
}
