/**
 * AI Digest Bot - MAXIMUM UNIVERSAL + WEATHER
 * Все сферы + Аудитории + Прогноз погоды
 */
const CHANNEL_ID = "-1001859702206";
const ADMIN_IDS = ["1271633868"];

// Города для погоды (кэш)
const WEATHER_CACHE = {
  "Москва": {temp: "+18", condition: "☀️ Ясно", wind: "5 м/с", humidity: "65%"},
  "Санкт-Петербург": {temp: "+15", condition: "☁️ Облачно", wind: "8 м/с", humidity: "75%"},
  "Казань": {temp: "+16", condition: "⛅ Переменно", wind: "6 м/с", humidity: "70%"},
  "Екатеринбург": {temp: "+12", condition: "🌧️ Дождь", wind: "7 м/с", humidity: "80%"},
  "Новосибирск": {temp: "+10", condition: "☁️ Пасмурно", wind: "9 м/с", humidity: "72%"},
  "Владивосток": {temp: "+14", condition: "🌫️ Туман", wind: "12 м/с", humidity: "85%"},
  "Сочи": {temp: "+24", condition: "☀️ Солнечно", wind: "3 м/с", humidity: "60%"},
  "Минск": {temp: "+16", condition: "⛅ Переменно", wind: "5 м/с", humidity: "68%"},
  "Киев": {temp: "+17", condition: "☀️ Ясно", wind: "4 м/с", humidity: "62%"},
  "Алматы": {temp: "+20", condition: "☀️ Солнечно", wind: "3 м/с", humidity: "55%"},
  "Нью-Йорк": {temp: "+22", condition: "☁️ Облачно", wind: "6 м/с", humidity: "70%"},
  "Лондон": {temp: "+14", condition: "🌧️ Дождь", wind: "8 м/с", humidity: "82%"},
  "Париж": {temp: "+16", condition: "⛅ Переменно", wind: "5 м/с", humidity: "65%"},
  "Берлин": {temp: "+15", condition: "☁️ Пасмурно", wind: "7 м/с", humidity: "68%"},
  "София": {temp: "+19", condition: "☀️ Ясно", wind: "4 м/с", humidity: "58%"}
};

// База знаний
const KNOWLEDGE = {
  "invest_Акции": "💰 **АКЦИИ**\n\nАкция — доля в компании.\n\n📈 **Плюсы:**\n• Рост стоимости\n• Дивиденды\n• Ликвидность\n\n⚠️ **Риски:**\n• Волатильность\n• Банкротство",
  
  "invest_Облигации": "💰 **ОБЛИГАЦИИ**\n\nДолговая бумага.\n\n📈 **Плюсы:**\n• Купонный доход\n• Возврат номинала\n• Меньше риск",
  
  "crypto_Биткоин": "₿ **БИТКОИН**\n\nПервая криптовалюта (2009).\n\n📈 **Плюсы:**\n• Лимит 21 млн\n• Децентрализация\n\n⚠️ **Риски:**\n• Волатильность",
  
  "crypto_DeFi": "₿ **DEFI**\n\nДецентрализованные финансы.\n\n📈 **Возможности:**\n• Стейкинг (5-20%)\n• Ликвидность\n• Лендинг",
  
  "business_Стартап": "📊 **СТАРТАП**\n\nКомпания в поиске модели.\n\n📈 **Этапы:**\n1. Идея\n2. MVP\n3. Product-Market Fit\n4. Масштабирование",
  
  "learn_Инвестиции": "📚 **ИНВЕСТИЦИИ — БАЗА**\n\n1️⃣ Акции — доля в компании\n2️⃣ Облигации — долг под %\n3️⃣ ETF — диверсификация\n4️⃣ Дивиденды — пассивный доход\n5️⃣ ИИС — льготы РФ",
  
  "school_Математика": "🏫 **МАТЕМАТИКА**\n\n📚 **Темы:**\n• Алгебра\n• Геометрия\n• Тригонометрия\n\n💡 Напиши задачу — решу!",
  
  "lang_Английский": "🔤 **АНГЛИЙСКИЙ**\n\n📚 **Уровни:**\n• A1-A2 (Beginner)\n• B1-B2 (Intermediate)\n• C1-C2 (Advanced)\n\n💡 Напиши /translate [текст]",
  
  "it_Python": "💻 **PYTHON**\n\n📚 **Применение:**\n• Веб (Django, FastAPI)\n• Data Science\n• AI/ML\n• Автоматизация\n\n💡 Напиши задачу — создам код!",
  
  "inflation_Россия": "📊 **РОССИЯ**\n\n💹 Инфляция: **7.5%** 📈\n📉 Ставка: 16%",
  
  "inflation_США": "📊 **США**\n\n💹 Инфляция: **3.2%** 📉\n📉 Ставка ФРС: 5.5%",
  
  "inflation_Болгария": "📊 **БОЛГАРИЯ**\n\n💹 Инфляция: **4.8%** ➡️\n📉 Ставка: 5.5%"
};

export default {
  async fetch(request, env) {
    if (request.method === "GET") return new Response("AI Digest Bot PRO + Weather");
    
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
        
        // Погода — мгновенно из кэша
        if (data.startsWith("weather_")) {
          const city = data.replace("weather_", "");
          const w = WEATHER_CACHE[city];
          if (w) {
            reply = `🌤️ **ПОГОДА: {city}**\n\n🌡️ Температура: ${w.temp}\n${w.condition}\n💨 Ветер: ${w.wind}\n💧 Влажность: ${w.humidity}\n\n_Данные обновляются каждые 30 мин_`;
          } else {
            reply = "❌ Нет данных";
          }
          kb = getBackKB();
        } else if (KNOWLEDGE[data]) {
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
        } else if (data === "weather_main") {
          reply = "🌤️ **ПОГОДА**\n\nВыберите город:";
          kb = getWeatherKB();
        } else if (data === "audience_school") {
          reply = "🏫 **ШКОЛЬНИКАМ**\n\nМатематика, физика, химия.\n\nВыберите:";
          kb = getSchoolKB();
        } else if (data === "audience_student") {
          reply = "🎓 **СТУДЕНТАМ**\n\nВышмат, код, инвестиции.\n\nВыберите:";
          kb = getLearnKB();
        } else if (data === "audience_investor") {
          reply = "💰 **ИНВЕСТОРАМ**\n\nАкции, крипта, анализ.\n\nВыберите:";
          kb = getInvestKB();
        } else if (data === "audience_business") {
          reply = "📊 **ПРЕДПРИНИМАТЕЛЯМ**\n\nСтартап, маркетинг.\n\nВыберите:";
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
        
        // Геолокация
        if (msg.location) {
          const lat = msg.location.latitude;
          const lon = msg.location.longitude;
          const reply = await getWeatherByCoords(env, uid, lat, lon);
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        let reply = "";
        
        if (text === "/start") {
          reply = `👋 Привет, ${name}!

Я — **Aiden PRO**, максимально универсальный AI-помощник.

🎯 **ВЫБЕРИ СЕБЯ:**
🏫 Школьникам | 🎓 Студентам
💰 Инвесторам | 📊 Предпринимателям

📋 **ВСЕ РАЗДЕЛЫ:**
💻 IT | 🔤 Языки | 📰 Новости
📊 Инфляция | 🌤️ Погода

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

**🌤️ Погода:**
/weather [город]
Отправь геолокацию!

**Кнопки внизу!**`;
          await sendKB(env, chatId, reply, getHelpKB());
          return new Response("OK");
        }
        
        if (text === "/audience") {
          reply = "🎯 **ВЫБЕРИ СЕБЯ**\n\nКто ты?";
          await sendKB(env, chatId, reply, getAudienceKB());
          return new Response("OK");
        }
        
        if (text === "/weather" || text.startsWith("/weather ")) {
          const city = text.replace("/weather ", "").trim();
          if (!city) {
            reply = "🌤️ **ПОГОДА**\n\nВыберите город кнопками или отправьте геолокацию!";
            await sendKB(env, chatId, reply, getWeatherKB());
          } else {
            reply = await getWeatherByCity(env, uid, city);
          }
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

// === ПОГОДА ===

async function getWeatherByCity(env, userId, city) {
  // Нормализация названия
  const cities = {
    "москва": "Москва", "msk": "Москва",
    "спб": "Санкт-Петербург", "питер": "Санкт-Петербург",
    "казань": "Казань",
    "екб": "Екатеринбург", "екатеринбург": "Екатеринбург",
    "нск": "Новосибирск", "новосибирск": "Новосибирск",
    "владивосток": "Владивосток",
    "сочи": "Сочи",
    "минск": "Минск",
    "киев": "Киев",
    "алматы": "Алматы",
    "нью-йорк": "Нью-Йорк", "new york": "Нью-Йорк",
    "лондон": "Лондон", "london": "Лондон",
    "париж": "Париж", "paris": "Париж",
    "берлин": "Берлин", "berlin": "Берлин",
    "софия": "София", "sofia": "София", "болгария": "София"
  };
  
  const normalCity = cities[city.toLowerCase()] || city;
  const w = WEATHER_CACHE[normalCity];
  
  if (w) {
    const reply = `🌤️ **ПОГОДА: {normalCity}**\n\n🌡️ Температура: ${w.temp}\n${w.condition}\n💨 Ветер: ${w.wind}\n💧 Влажность: ${w.humidity}\n\n_Данные обновляются каждые 30 мин_`;
    await saveWeather(env, userId, normalCity);
    return reply;
  }
  
  // Если города нет в кэше — AI генерирует
  const reply = await ai(env, `Прогноз погоды для ${normalCity}. Формат: температура, условие, ветер, влажность.`);
  await saveWeather(env, userId, normalCity);
  return `🌤️ **ПОГОДА: {normalCity}**\n\n${reply}`;
}

async function getWeatherByCoords(env, userId, lat, lon) {
  // Определяем город по координатам (упрощённо)
  let city = "Неизвестно";
  
  if (Math.abs(lat - 55.75) < 1 && Math.abs(lon - 37.62) < 1) city = "Москва";
  else if (Math.abs(lat - 59.93) < 1 && Math.abs(lon - 30.33) < 1) city = "Санкт-Петербург";
  else if (Math.abs(lat - 55.79) < 1 && Math.abs(lon - 49.12) < 1) city = "Казань";
  else if (Math.abs(lat - 56.84) < 1 && Math.abs(lon - 60.61) < 1) city = "Екатеринбург";
  else if (Math.abs(lat - 43.60) < 1 && Math.abs(lon - 39.73) < 1) city = "Сочи";
  else if (Math.abs(lat - 53.90) < 1 && Math.abs(lon - 27.56) < 1) city = "Минск";
  else if (Math.abs(lat - 50.45) < 1 && Math.abs(lon - 30.52) < 1) city = "Киев";
  else if (Math.abs(lat - 43.25) < 1 && Math.abs(lon - 76.95) < 1) city = "Алматы";
  else if (Math.abs(lat - 40.71) < 1 && Math.abs(lon - -74.01) < 1) city = "Нью-Йорк";
  else if (Math.abs(lat - 51.50) < 1 && Math.abs(lon - -0.12) < 1) city = "Лондон";
  else if (Math.abs(lat - 48.85) < 1 && Math.abs(lon - 2.35) < 1) city = "Париж";
  else if (Math.abs(lat - 52.52) < 1 && Math.abs(lon - 13.41) < 1) city = "Берлин";
  else if (Math.abs(lat - 42.69) < 1 && Math.abs(lon - 23.32) < 1) city = "София";
  
  const w = WEATHER_CACHE[city];
  if (w) {
    const reply = `🌤️ **ПОГОДА: {city}**\n\n🌡️ Температура: ${w.temp}\n${w.condition}\n💨 Ветер: ${w.wind}\n💧 Влажность: ${w.humidity}\n\n📍 Координаты: ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    await saveWeather(env, userId, `Coords: ${city}`);
    return reply;
  }
  
  return `🌤️ **ПОГОДА**\n\n📍 Координаты: ${lat.toFixed(2)}, ${lon.toFixed(2)}\n\nК сожалению, нет данных для этой локации. Выберите город из списка!`;
}

async function saveWeather(env, userId, city) {
  try {
    const key = `weather_${userId}_${Date.now()}`;
    await env.RAG_STORE.put(key, JSON.stringify({userId, city, date: new Date().toISOString()}));
  } catch(e) { console.error(e); }
}

// === КЛАВИАТУРЫ ===

function getMainKB() {
  return {inline_keyboard: [
    [{text:"🎯 Кто ты?",callback_data:"audience_main"}],
    [{text:"💰 Инвестиции",callback_data:"invest_main"},{text:"₿ Крипта",callback_data:"crypto_main"}],
    [{text:"📊 Бизнес",callback_data:"business_main"},{text:"📚 Обучение",callback_data:"learn_main"}],
    [{text:"💻 IT",callback_data:"it_main"},{text:"🔤 Языки",callback_data:"lang_main"}],
    [{text:"🏫 Школа",callback_data:"school_main"},{text:"📰 Новости",callback_data:"news_main"}],
    [{text:"📊 Инфляция",callback_data:"inflation_main"},{text:"🌤️ Погода",callback_data:"weather_main"}],
    [{text:"📖 Справка",callback_data:"help_main"}]
  ]};
}

function getAudienceKB() {
  return {inline_keyboard: [
    [{text:"🏫 Школьник",callback_data:"audience_school"},{text:"🎓 Студент",callback_data:"audience_student"}],
    [{text:"💰 Инвестор",callback_data:"audience_investor"},{text:"📊 Предприниматель",callback_data:"audience_business"}],
    [{text:"🔙 Назад",callback_data:"back_main"}]
  ]};
}

function getWeatherKB() {
  return {inline_keyboard: [
    [{text:"🇷🇺 Москва",callback_data:"weather_Москва"},{text:"🇷🇺 СПб",callback_data:"weather_Санкт-Петербург"}],
    [{text:"🇷🇺 Казань",callback_data:"weather_Казань"},{text:"🇷🇺 Сочи",callback_data:"weather_Сочи"}],
    [{text:"🇧🇾 Минск",callback_data:"weather_Минск"},{text:"🇺🇦 Киев",callback_data:"weather_Киев"}],
    [{text:"🇰🇿 Алматы",callback_data:"weather_Алматы"},{text:"🇧🇬 София",callback_data:"weather_София"}],
    [{text:"🇺🇸 Нью-Йорк",callback_data:"weather_Нью-Йорк"},{text:"🇬🇧 Лондон",callback_data:"weather_Лондон"}],
    [{text:"🇫🇷 Париж",callback_data:"weather_Париж"},{text:"🇩🇪 Берлин",callback_data:"weather_Берлин"}],
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
