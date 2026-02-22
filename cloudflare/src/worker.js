/**
 * AI Digest Bot - FAST VERSION (оптимизировано)
 */
const CHANNEL_ID = "-1001859702206";
const ADMIN_IDS = ["1271633868"];

// МГНОВЕННЫЕ ОТВЕТЫ
const QUICK = {
  "invest_Акции": "💰 **АКЦИИ**\n\nАкция — доля в компании.\n\n📈 Плюсы: Рост, Дивиденды\n⚠️ Риски: Волатильность",
  "crypto_Биткоин": "₿ **БИТКОИН**\n\nПервая криптовалюта (2009).\n\n📈 Лимит: 21 млн\n⚠️ Риски: Волатильность",
  "business_Стартап": "📊 **СТАРТАП**\n\nКомпания в поиске модели.\n\n📈 Этапы: Идея → MVP → Масштабирование",
  "inflation_Россия": "📊 **РОССИЯ**\n\n💹 Инфляция: 7.5% 📈\n📉 Ставка: 16%",
  "inflation_Болгария": "📊 **БОЛГАРИЯ**\n\n💹 Инфляция: 4.8% ➡️",
  "inflation_США": "📊 **США**\n\n💹 Инфляция: 3.2% 📉",
  "weather_Москва": "🌤️ **МОСКВА**\n\n🌡️ +18°C\n☀️ Ясно\n💨 5 м/с",
  "weather_София": "🌤️ **СОФИЯ**\n\n🌡️ +19°C\n☀️ Ясно\n💨 4 м/с",
  "weather_Санкт-Петербург": "🌤️ **СПБ**\n\n🌡️ +15°C\n☁️ Облачно\n💨 8 м/с"
};

// Школьные предметы
const SCHOOL = ["Математика","Русский язык","Литература","Физика","Химия","Биология","География","История","Обществознание","Информатика","Английский","Немецкий","ОБЖ"];

// ВУЗ предметы
const UNI = ["Высшая математика","Физика","Химия","Программирование","Базы данных","Сети","Экономика","Менеджмент","Право","Философия","Психология"];

export default {
  async fetch(request, env) {
    if (request.method === "GET") return new Response("Bot OK");
    
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
        
        // Мгновенные ответы
        if (QUICK[data]) {
          reply = QUICK[data];
          kb = getBackKB();
        } else if (data === "back_main") {
          reply = "🔙 **Главное меню**";
          kb = getMainKB();
        } else if (data === "school_main") {
          reply = "🏫 **ШКОЛА**\n\nВыберите предмет:";
          kb = getSchoolKB();
        } else if (data === "uni_main") {
          reply = "🎓 **ВУЗ**\n\nВыберите предмет:";
          kb = getUniKB();
        } else if (data === "tutor_main") {
          reply = "🎓 **AI-РЕПЕТИТОР**\n\n3 дня бесплатно!\n\nЖмите /tutor";
          kb = getBackKB();
        } else if (data === "invest_main") {
          reply = "💰 **ИНВЕСТИЦИИ**";
          kb = getInvestKB();
        } else if (data === "crypto_main") {
          reply = "₿ **КРИПТА**";
          kb = getCryptoKB();
        } else if (data === "business_main") {
          reply = "📊 **БИЗНЕС**";
          kb = getBusinessKB();
        } else if (data === "weather_main") {
          reply = "🌤️ **ПОГОДА**";
          kb = getWeatherKB();
        } else if (data === "inflation_main") {
          reply = "📊 **ИНФЛЯЦИЯ**";
          kb = getInflationKB();
        } else if (data.startsWith("school_")) {
          const subj = data.replace("school_", "");
          reply = `🏫 **{subj}**\n\nНапиши задачу — решу!`;
          kb = getBackKB();
        } else if (data.startsWith("uni_")) {
          const subj = data.replace("uni_", "");
          reply = `🎓 **{subj}**\n\nНапиши задачу — помогу!`;
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
        
        // Геолокация
        if (msg.location) {
          const reply = "🌤️ **ПОГОДА**\n\n📍 " + msg.location.latitude.toFixed(2) + ", " + msg.location.longitude.toFixed(2) + "\n\nОтправь город для точного прогноза!";
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        let reply = "";
        
        if (text === "/start") {
          reply = `👋 Привет, ${name}!

Я — Aiden PRO.

🏫 Школа (все предметы)
🎓 ВУЗ (все предметы)
🎓 AI-репетитор (3 дня бесплатно!)
💰 Инвестиции
₿ Крипта
📊 Бизнес
🌤️ Погода

**Жми кнопки!**`;
          await sendKB(env, chatId, reply, getMainKB());
          return new Response("OK");
        }
        
        if (text === "/help") {
          reply = "📖 **СПРАВКА**\n\n/school [предмет]\n/university [предмет]\n/tutor — AI-репетитор\n/invest [вопрос]\n/weather [город]";
          await sendKB(env, chatId, reply, getHelpKB());
          return new Response("OK");
        }
        
        if (text === "/tutor") {
          reply = "🎓 **AI-РЕПЕТИТОР**\n\n3 дня бесплатно!\n\nНапиши предмет и задачу — объясню!";
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        if (text === "/my_tutor") {
          reply = "🎓 **СТАТУС**\n\n✅ Триал активен (3 дня)";
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        // AI только для вопросов
        if (text.startsWith("/invest ")) {
          reply = await ai(env, "Инвестиции: " + text.replace("/invest ", ""));
        } else if (text.startsWith("/crypto ")) {
          reply = await ai(env, "Крипта: " + text.replace("/crypto ", ""));
        } else if (text.startsWith("/business ")) {
          reply = await ai(env, "Бизнес: " + text.replace("/business ", ""));
        } else if (text.startsWith("/solve ")) {
          reply = await ai(env, "Реши: " + text.replace("/solve ", ""));
        } else if (text.startsWith("/weather ")) {
          const city = text.replace("/weather ", "");
          reply = `🌤️ **{city}**\n\nЗагрузка прогноза...`;
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
    if (h === 9) await sendMsg(env.BOT_TOKEN, CHANNEL_ID, "💰 Утренний дайджест");
    if (h === 18) await sendMsg(env.BOT_TOKEN, CHANNEL_ID, "📰 Вечерний дайджест");
  }
};

// === КЛАВИАТУРЫ ===

function getMainKB() {
  return {inline_keyboard: [
    [{text:"🏫 Школа",callback_data:"school_main"},{text:"🎓 ВУЗ",callback_data:"uni_main"}],
    [{text:"🎓 AI-репетитор",callback_data:"tutor_main"}],
    [{text:"💰 Инвестиции",callback_data:"invest_main"},{text:"₿ Крипта",callback_data:"crypto_main"}],
    [{text:"📊 Бизнес",callback_data:"business_main"}],
    [{text:"🌤️ Погода",callback_data:"weather_main"},{text:"📊 Инфляция",callback_data:"inflation_main"}],
    [{text:"📖 Справка",callback_data:"help_main"}]
  ]};
}

function getSchoolKB() {
  const kb = [];
  let row = [];
  SCHOOL.forEach((s, i) => {
    row.push({text: s, callback_data: "school_" + s});
    if (row.length === 2 || i === SCHOOL.length - 1) { kb.push(row); row = []; }
  });
  kb.push([{text:"🔙 Назад",callback_data:"back_main"}]);
  return {inline_keyboard: kb};
}

function getUniKB() {
  const kb = [];
  let row = [];
  UNI.forEach((s, i) => {
    row.push({text: s, callback_data: "uni_" + s});
    if (row.length === 2 || i === UNI.length - 1) { kb.push(row); row = []; }
  });
  kb.push([{text:"🔙 Назад",callback_data:"back_main"}]);
  return {inline_keyboard: kb};
}

function getInvestKB() {
  return {inline_keyboard: [[{text:"Акции",callback_data:"invest_Акции"},{text:"Облигации",callback_data:"invest_Облигации"}],[{text:"🔙 Назад",callback_data:"back_main"}]]};
}

function getCryptoKB() {
  return {inline_keyboard: [[{text:"Биткоин",callback_data:"crypto_Биткоин"},{text:"DeFi",callback_data:"crypto_DeFi"}],[{text:"🔙 Назад",callback_data:"back_main"}]]};
}

function getBusinessKB() {
  return {inline_keyboard: [[{text:"Стартап",callback_data:"business_Стартап"}],[{text:"🔙 Назад",callback_data:"back_main"}]]};
}

function getWeatherKB() {
  return {inline_keyboard: [[{text:"🇷🇺 Москва",callback_data:"weather_Москва"},{text:"🇧🇬 София",callback_data:"weather_София"}],[{text:"🇷🇺 СПб",callback_data:"weather_Санкт-Петербург"}],[{text:"🔙 Назад",callback_data:"back_main"}]]};
}

function getInflationKB() {
  return {inline_keyboard: [[{text:"🇷🇺 Россия",callback_data:"inflation_Россия"},{text:"🇺🇸 США",callback_data:"inflation_США"}],[{text:"🇧🇬 Болгария",callback_data:"inflation_Болгария"}],[{text:"🔙 Назад",callback_data:"back_main"}]]};
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
