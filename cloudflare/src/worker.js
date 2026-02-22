/**
 * AI Digest Bot - FULL VERSION
 * Реальная оплата Stars + Модерация + Реальные API + Постинг в каналы
 */
const CHANNEL_ID = "-1001859702206"; // ai_world_russia
const INVEST_CHANNEL = "-1001644114424"; // @investora_zametki
const ADMIN_IDS = ["1271633868"];

// МГНОВЕННЫЕ ОТВЕТЫ
const QUICK = {
  "invest_Акции": "💰 **АКЦИИ**\n\nАкция — доля в компании.\n\n📈 Плюсы: Рост, Дивиденды\n⚠️ Риски: Волатильность",
  "crypto_Биткоин": "₿ **БИТКОИН**\n\nПервая криптовалюта (2009).\n\n📈 Лимит: 21 млн\n⚠️ Риски: Волатильность",
  "business_Стартап": "📊 **СТАРТАП**\n\nКомпания в поиске модели.\n\n📈 Этапы: Идея → MVP → Масштабирование",
  "inflation_Россия": "📊 **РОССИЯ**\n\n💹 Инфляция: 7.5% 📈\n📉 Ставка: 16%",
  "inflation_Болгария": "📊 **БОЛГАРИЯ**\n\n💹 Инфляция: 4.8% ➡️",
  "inflation_США": "📊 **США**\n\n💹 Инфляция: 3.2% 📉"
};

const SCHOOL = ["Математика","Русский язык","Литература","Физика","Химия","Биология","География","История","Обществознание","Информатика","Английский","Немецкий","ОБЖ"];
const UNI = ["Высшая математика","Физика","Химия","Программирование","Базы данных","Сети","Экономика","Менеджмент","Право","Философия","Психология"];

// Реферальная система
const REFERRAL_REWARD = 50;

// Платные функции
const PAID_FEATURES = {
  "tutor": {name: "AI-репетитор", price: 99, duration: "1 месяц", desc: "Персональная помощь"},
  "homework": {name: "Проверка ДЗ", price: 29, duration: "1 проверка", desc: "Разбор ошибок"},
  "exam": {name: "Подготовка к экзамену", price: 149, duration: "2 недели", desc: "ЕГЭ, ОГЭ, сессия"},
  "essay": {name: "Проверка сочинений", price: 49, duration: "1 сочинение", desc: "Разбор + рекомендации"},
  "premium": {name: "PREMIUM", price: 299, duration: "1 месяц", desc: "Все функции безлимитно"}
};

// Модерация (спам паттерны)
const SPAM_PATTERNS = [
  /https?:\/\/\S+/i,
  /@[a-zA-Z0-9_]{5,}/,
  /(заработ|казино|крипто|инвест).{0,30}(денег|прибыль)/i,
  /(18\+|порно|секс)/i
];

export default {
  async fetch(request, env) {
    if (request.method === "GET") return new Response("AI Digest Bot FULL");
    
    if (request.method === "POST") {
      const update = await request.json();
      
      // Pre-checkout query (оплата Stars)
      if (update.pre_checkout_query) {
        await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/answerPreCheckoutQuery`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            pre_checkout_query_id: update.pre_checkout_query.id,
            ok: true
          })
        });
        return new Response("OK");
      }
      
      // Successful payment
      if (update.message?.successful_payment) {
        const userId = update.message.from.id.toString();
        const chatId = update.message.chat.id;
        const payment = update.message.successful_payment;
        
        // Активация функции
        const feature = payment.invoice_payload;
        await activatePaidFeature(env, userId, feature);
        
        await sendMsg(env.BOT_TOKEN, chatId, `✅ **Оплата успешна!**\n\nФункция активирована.\n\n/my_paid — мои покупки`);
        return new Response("OK");
      }
      
      // Кнопки
      if (update.callback_query) {
        const cb = update.callback_query;
        const data = cb.data;
        const chatId = cb.message.chat.id;
        const msgId = cb.message.message_id;
        const userId = cb.from.id.toString();
        
        let reply = "";
        let kb = null;
        
        if (QUICK[data]) { reply = QUICK[data]; kb = getBackKB();
        } else if (data === "back_main") { reply = "🔙 **Главное меню**"; kb = getMainKB();
        } else if (data === "school_main") { reply = "🏫 **ШКОЛА**"; kb = getSchoolKB();
        } else if (data === "uni_main") { reply = "🎓 **ВУЗ**"; kb = getUniKB();
        } else if (data === "tutor_main") {
          const has = await checkTutorAccess(env, userId);
          reply = has ? "🎓 **AI-РЕПЕТИТОР**\n\n✅ Активна подписка!" : "🎓 **AI-РЕПЕТИТОР**\n\n💰 3 дня бесплатно!";
          kb = getTutorKB();
        } else if (data === "paid_main") { reply = "💎 **ПЛАТНЫЕ ФУНКЦИИ**"; kb = getPaidKB();
        } else if (data === "referral_main") {
          const ref = await getReferralData(env, userId);
          const paid = await getPaidReferrals(env, ref.referrals);
          reply = `👥 **РЕФЕРАЛЫ**\n\nПригласили: ${ref.referrals.length}\nКупили: ${paid.length}\n⭐ Заработано: ${ref.earned}\n\nСсылка:\n\`https://t.me/AidenHelpbot?start=ref_${userId}\``;
          kb = getBackKB();
        } else if (data === "invest_main") { reply = "💰 **ИНВЕСТИЦИИ**"; kb = getInvestKB();
        } else if (data === "crypto_main") { reply = "₿ **КРИПТА**"; kb = getCryptoKB();
        } else if (data === "business_main") { reply = "📊 **БИЗНЕС**"; kb = getBusinessKB();
        } else if (data === "weather_main") { reply = "🌤️ **ПОГОДА**"; kb = getWeatherKB();
        } else if (data === "inflation_main") { reply = "📊 **ИНФЛЯЦИЯ**"; kb = getInflationKB();
        } else if (data.startsWith("school_")) { reply = `🏫 **${data.replace("school_","")}**\n\nНапиши задачу!`; kb = getBackKB();
        } else if (data.startsWith("uni_")) { reply = `🎓 **${data.replace("uni_","")}**\n\nНапиши задачу!`; kb = getBackKB();
        } else if (data.startsWith("pay_")) {
          const f = PAID_FEATURES[data.replace("pay_","")];
          if (f) { reply = `💎 **${f.name}**\n\n${f.desc}\n\n💰 **{f.price} звёзд**\n⏱️ ${f.duration}`; kb = getBuyKB(data.replace("pay_","")); }
        } else if (data.startsWith("buy_")) {
          const f = PAID_FEATURES[data.replace("buy_","")];
          if (f) {
            await sendInvoice(env, chatId, f);
            return new Response("OK");
          }
        } else { reply = "🔙 Меню"; kb = getMainKB(); }
        
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
        
        // МОДЕРАЦИЯ в группах
        if (chatType === "group" || chatType === "supergroup") {
          const modResult = await moderateMessage(env, msg, uid);
          if (modResult.action === "delete") {
            await deleteMessage(env.BOT_TOKEN, chatId, msg.message_id);
            if (modResult.reason) await sendMsg(env.BOT_TOKEN, chatId, `⚠️ ${name}, ${modResult.reason}`);
            return new Response("OK");
          }
          if (!text.startsWith("/") && !text.includes("@AidenHelpbot")) {
            return new Response("OK");
          }
        }
        
        // Реферальная ссылка
        if (text.startsWith("/start ref_")) {
          const refId = text.replace("/start ref_", "");
          if (refId !== uid) {
            await addReferral(env, uid, refId);
            await activateTutor(env, uid, "trial", 3);
            await sendMsg(env.BOT_TOKEN, chatId, `✅ Вы по реферальной ссылке!\n\n🎁 3 дня бесплатно!\n\n/tutor — начать`);
            return new Response("OK");
          }
        }
        
        // Геолокация (погода)
        if (msg.location) {
          const weather = await getRealWeather(msg.location.latitude, msg.location.longitude);
          await sendMsg(env.BOT_TOKEN, chatId, `🌤️ **ПОГОДА**\n\n📍 ${msg.location.latitude.toFixed(2)}, ${msg.location.longitude.toFixed(2)}\n\n🌡️ ${weather.temp}°C\n${weather.condition}\n💨 ${weather.wind} м/с`);
          return new Response("OK");
        }
        
        let reply = "";
        
        if (text === "/start") {
          reply = `👋 Привет, ${name}!

Я — Aiden PRO.

🏫 Школа | 🎓 ВУЗ
🎓 AI-репетитор (3 дня бесплатно!)
💎 Платные функции
💰 Инвестиции | ₿ Крипта
📊 Бизнес | 🌤️ Погода

**Жми кнопки!**

👥 Рефералы — 50 звёзд за покупку!
/ref — твоя ссылка`;
          await sendKB(env, chatId, reply, getMainKB());
          return new Response("OK");
        }
        
        if (text === "/help") {
          reply = "📖 **СПРАВКА**\n\n/school [предмет]\n/university [предмет]\n/tutor — AI-репетитор\n/paid — платные функции\n/ref — рефералы\n/my_tutor — статус\n/my_paid — покупки\n/invest [вопрос]\n/weather [город]";
          await sendKB(env, chatId, reply, getHelpKB());
          return new Response("OK");
        }
        
        if (text === "/tutor") {
          const has = await checkTutorAccess(env, uid);
          reply = has ? "🎓 **AI-РЕПЕТИТОР**\n\n✅ Активна подписка!\n\nНапиши предмет и задачу!" : "🎓 **AI-РЕПЕТИТОР**\n\n⚠️ Нет подписки.\n\n💰 3 дня бесплатно!\n\n/paid — купить";
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        if (text === "/paid") {
          reply = "💎 **ПЛАТНЫЕ ФУНКЦИИ**\n\n🎓 AI-репетитор — 99⭐/мес\n📝 Проверка ДЗ — 29⭐\n📚 Экзамен — 149⭐\n✍️ Сочинение — 49⭐\n⭐ PREMIUM — 299⭐/мес";
          await sendKB(env, chatId, reply, getPaidKB());
          return new Response("OK");
        }
        
        if (text === "/my_paid") {
          const paid = await getPaidFeatures(env, uid);
          reply = paid.length === 0 ? "💎 **ПОКУПКИ**\n\n❌ Нет покупок" : "💎 **ПОКУПКИ**\n\n" + paid.map(p => `✅ **${p.feature}**\n📅 До: ${new Date(p.expires).toLocaleDateString('ru-RU')}`).join("\n\n");
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        if (text === "/ref") {
          const ref = await getReferralData(env, uid);
          const paid = await getPaidReferrals(env, ref.referrals);
          reply = `👥 **РЕФЕРАЛЫ**\n\nПригласили: ${ref.referrals.length}\n💰 Купили: ${paid.length}\n⭐ Заработано: ${ref.earned} звёзд\n\n50⭐ за покупку!\n\nСсылка:\n\`https://t.me/AidenHelpbot?start=ref_${uid}\``;
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        if (text === "/my_tutor") {
          reply = "🎓 **СТАТУС**\n\n" + await getTutorStatus(env, uid);
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        if (text === "/weather" || text.startsWith("/weather ")) {
          const city = text.replace("/weather ", "").trim();
          const weather = await getRealWeatherByCity(city);
          reply = `🌤️ **ПОГОДА: {city}**\n\n🌡️ ${weather.temp}°C\n${weather.condition}\n💨 ${weather.wind} м/с\n💧 ${weather.humidity}%`;
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        // AI для вопросов
        if (text.startsWith("/invest ")) reply = await ai(env, "Инвестиции: " + text.replace("/invest ", ""));
        else if (text.startsWith("/crypto ")) reply = await ai(env, "Крипта: " + text.replace("/crypto ", ""));
        else if (text.startsWith("/business ")) reply = await ai(env, "Бизнес: " + text.replace("/business ", ""));
        else if (text.startsWith("/solve ")) reply = await ai(env, "Реши: " + text.replace("/solve ", ""));
        else if (text.startsWith("/ask ")) reply = await ai(env, text.replace("/ask ", ""));
        else if (text.startsWith("/")) reply = "❓ /help";
        else if (text.includes("@AidenHelpbot")) reply = await ai(env, text.replace("@AidenHelpbot", ""));
        else return new Response("OK");
        
        if (reply) await sendMsg(env.BOT_TOKEN, chatId, reply);
      }
      
      return new Response("OK");
    }
    
    return new Response("No");
  },
  
  // АВТОПОСТИНГ в КАНАЛЫ
  async scheduled(event, env) {
    const h = new Date().getUTCHours();
    const day = new Date().getUTCDay();
    
    // 9:00 - Инвестиции (Пн, Ср, Пт)
    if (h === 9 && [1,3,5].includes(day)) {
      const post = await ai(env, "Пост про инвестиции. 500-800 символов. Эмодзи, хэштеги.");
      await sendMsg(env.BOT_TOKEN, INVEST_CHANNEL, `💰 **ИНВЕСТИЦИИ**\n\n${new Date().toLocaleDateString('ru-RU')}\n\n${post}`);
    }
    
    // 12:00 - Крипта (Вт, Чт)
    if (h === 12 && [2,4].includes(day)) {
      const post = await ai(env, "Пост про криптовалюты. 500-800 символов. Эмодзи, хэштеги.");
      await sendMsg(env.BOT_TOKEN, INVEST_CHANNEL, `₿ **КРИПТА**\n\n${new Date().toLocaleDateString('ru-RU')}\n\n${post}`);
    }
    
    // 15:00 - Бизнес (Пн, Чт)
    if (h === 15 && [1,4].includes(day)) {
      const post = await ai(env, "Пост про бизнес. 500-800 символов. Эмодзи, хэштеги.");
      await sendMsg(env.BOT_TOKEN, INVEST_CHANNEL, `📊 **БИЗНЕС**\n\n${new Date().toLocaleDateString('ru-RU')}\n\n${post}`);
    }
    
    // 18:00 - Дайджест (ежедневно)
    if (h === 18) {
      const digest = await ai(env, "Дайджест за день: рынки, крипта, бизнес. Кратко.");
      await sendMsg(env.BOT_TOKEN, INVEST_CHANNEL, `📰 **ДАЙДЖЕСТ**\n\n${new Date().toLocaleDateString('ru-RU')}\n\n${digest}`);
    }
  }
};

// === МОДЕРАЦИЯ ===

async function moderateMessage(env, msg, userId) {
  const text = msg.text || msg.caption || "";
  
  // Спам паттерны
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      return {action: "delete", reason: "спам запрещён"};
    }
  }
  
  // AI модерация
  try {
    const mod = await ai(env, `Модерация. Верни JSON: {"action":"allow|delete|warn","reason":"..."}. Текст: ${text.slice(0, 200)}`);
    const result = JSON.parse(mod.replace(/```json/g,"").replace(/```/g,"").trim());
    return result;
  } catch(e) {
    return {action: "allow"};
  }
}

async function deleteMessage(token, chatId, msgId) {
  await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({chat_id: chatId, message_id: msgId})
  });
}

// === ОПЛАТА STARS ===

async function sendInvoice(env, chatId, feature) {
  const f = PAID_FEATURES[feature];
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendInvoice`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      chat_id: chatId,
      title: f.name,
      description: f.desc,
      payload: feature,
      currency: "XTR", // Telegram Stars
      prices: [{label: f.name, amount: f.price}],
      provider_token: "",
      start_parameter: "pay_"+feature,
      need_name: false,
      need_phone_number: false,
      need_email: false,
      need_shipping_address: false
    })
  });
}

// === РЕФЕРАЛЫ ===

async function getReferralData(env, userId) {
  try {
    const data = await env.RAG_STORE.get(`ref_${userId}`);
    return data ? JSON.parse(data) : {referrer: null, referrals: [], earned: 0};
  } catch(e) { return {referrer: null, referrals: [], earned: 0}; }
}

async function addReferral(env, userId, referrerId) {
  try {
    await env.RAG_STORE.put(`ref_${userId}`, JSON.stringify({referrer: referrerId, referrals: [], earned: 0}));
    const ref = await getReferralData(env, referrerId);
    if (!ref.referrals.includes(userId)) {
      ref.referrals.push(userId);
      await env.RAG_STORE.put(`ref_${referrerId}`, JSON.stringify(ref));
    }
  } catch(e) { console.error(e); }
}

async function getPaidReferrals(env, referrals) {
  const paid = [];
  for (const id of referrals) {
    if (await checkTutorAccess(env, id)) paid.push(id);
  }
  return paid;
}

async function payReferralReward(env, userId) {
  try {
    const user = await getReferralData(env, userId);
    if (user.referrer) {
      const ref = await getReferralData(env, user.referrer);
      ref.earned += REFERRAL_REWARD;
      await env.RAG_STORE.put(`ref_${user.referrer}`, JSON.stringify(ref));
      await sendMsg(env.BOT_TOKEN, user.referrer, `⭐ **+${REFERRAL_REWARD} звёзд**!\nРеферал купил подписку!\nВсего: ${ref.earned}⭐`);
    }
  } catch(e) { console.error(e); }
}

// === AI-РЕПЕТИТОР ===

async function checkTutorAccess(env, userId) {
  try {
    const data = await env.RAG_STORE.get(`tutor_${userId}`);
    if (!data) return false;
    const sub = JSON.parse(data);
    return new Date() < new Date(sub.expires);
  } catch(e) { return false; }
}

async function getTutorStatus(env, userId) {
  try {
    const data = await env.RAG_STORE.get(`tutor_${userId}`);
    if (!data) return "❌ Нет подписки\n\n/paid — купить";
    const sub = JSON.parse(data);
    const days = Math.ceil((new Date(sub.expires) - new Date()) / (1000*60*60*24));
    return `✅ **${sub.plan}**\n\n📅 До: ${new Date(sub.expires).toLocaleDateString('ru-RU')}\n⏳ Осталось: ${days} дн.`;
  } catch(e) { return "Ошибка"; }
}

async function activateTutor(env, userId, plan, days) {
  try {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    await env.RAG_STORE.put(`tutor_${userId}`, JSON.stringify({userId, plan, expires: expires.toISOString()}));
    if (plan !== "trial") await payReferralReward(env, userId);
    return true;
  } catch(e) { return false; }
}

// === ПЛАТНЫЕ ФУНКЦИИ ===

async function getPaidFeatures(env, userId) {
  try {
    const data = await env.RAG_STORE.get(`paid_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch(e) { return []; }
}

async function activatePaidFeature(env, userId, feature) {
  try {
    const f = PAID_FEATURES[feature];
    if (!f) return false;
    const days = feature==="homework"||feature==="essay" ? 1 : feature==="exam" ? 14 : 30;
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    const paid = await getPaidFeatures(env, userId);
    paid.push({feature: f.name, expires: expires.toISOString()});
    await env.RAG_STORE.put(`paid_${userId}`, JSON.stringify(paid));
    await payReferralReward(env, userId);
    return true;
  } catch(e) { return false; }
}

// === ПОГОДА (реальное API) ===

async function getRealWeather(lat, lon) {
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const d = await r.json();
    return {
      temp: d.current_weather?.temperature || "N/A",
      condition: getWeatherCondition(d.current_weather?.weathercode),
      wind: d.current_weather?.windspeed || "N/A",
      humidity: "N/A"
    };
  } catch(e) { return {temp: "N/A", condition: "Ошибка", wind: "N/A", humidity: "N/A"}; }
}

async function getRealWeatherByCity(city) {
  const coords = {
    "москва": [55.75, 37.62], "спб": [59.93, 30.33], "казань": [55.79, 49.12],
    "екатеринбург": [56.84, 60.61], "новосибирск": [55.00, 82.93], "сочи": [43.60, 39.73],
    "минск": [53.90, 27.56], "киев": [50.45, 30.52], "алматы": [43.25, 76.95],
    "софия": [42.69, 23.32], "лондон": [51.50, -0.12], "париж": [48.85, 2.35],
    "берлин": [52.52, 13.41], "нью-йорк": [40.71, -74.01]
  };
  const c = coords[city.toLowerCase()] || [55.75, 37.62];
  return await getRealWeather(c[0], c[1]);
}

function getWeatherCondition(code) {
  const conditions = {0:"☀️ Ясно", 1:"🌤️ Преим. ясно", 2:"☁️ Облачно", 3:"☁️ Пасмурно", 45:"🌫️ Туман", 48:"🌫️ Туман", 51:"🌧️ Морось", 53:"🌧️ Морось", 55:"🌧️ Морось", 61:"🌧️ Дождь", 63:"🌧️ Дождь", 65:"🌧️ Дождь", 71:"🌨️ Снег", 73:"🌨️ Снег", 75:"🌨️ Снег", 95:"⛈️ Гроза", 96:"⛈️ Гроза", 99:"⛈️ Гроза"};
  return conditions[code] || "🌤️ Переменно";
}

// === КЛАВИАТУРЫ ===

function getMainKB() {
  return {inline_keyboard: [
    [{text:"🏫 Школа",callback_data:"school_main"},{text:"🎓 ВУЗ",callback_data:"uni_main"}],
    [{text:"🎓 AI-репетитор",callback_data:"tutor_main"},{text:"💎 Платные",callback_data:"paid_main"}],
    [{text:"👥 Рефералы",callback_data:"referral_main"}],
    [{text:"💰 Инвестиции",callback_data:"invest_main"},{text:"₿ Крипта",callback_data:"crypto_main"}],
    [{text:"📊 Бизнес",callback_data:"business_main"}],
    [{text:"🌤️ Погода",callback_data:"weather_main"},{text:"📊 Инфляция",callback_data:"inflation_main"}],
    [{text:"📖 Справка",callback_data:"help_main"}]
  ]};
}

function getSchoolKB() {
  const kb = []; let row = [];
  SCHOOL.forEach((s, i) => {
    row.push({text: s, callback_data: "school_" + s});
    if (row.length === 2 || i === SCHOOL.length - 1) { kb.push(row); row = []; }
  });
  kb.push([{text:"🔙 Назад",callback_data:"back_main"}]);
  return {inline_keyboard: kb};
}

function getUniKB() {
  const kb = []; let row = [];
  UNI.forEach((s, i) => {
    row.push({text: s, callback_data: "uni_" + s});
    if (row.length === 2 || i === UNI.length - 1) { kb.push(row); row = []; }
  });
  kb.push([{text:"🔙 Назад",callback_data:"back_main"}]);
  return {inline_keyboard: kb};
}

function getInvestKB() { return {inline_keyboard: [[{text:"Акции",callback_data:"invest_Акции"}],[{text:"🔙 Назад",callback_data:"back_main"}]]}; }
function getCryptoKB() { return {inline_keyboard: [[{text:"Биткоин",callback_data:"crypto_Биткоин"}],[{text:"🔙 Назад",callback_data:"back_main"}]]}; }
function getBusinessKB() { return {inline_keyboard: [[{text:"Стартап",callback_data:"business_Стартап"}],[{text:"🔙 Назад",callback_data:"back_main"}]]}; }

function getWeatherKB() {
  return {inline_keyboard: [
    [{text:"🇷🇺 Москва",callback_data:"weather_Москва"},{text:"🇷🇺 СПб",callback_data:"weather_СПб"}],
    [{text:"🇧🇬 София",callback_data:"weather_София"}],
    [{text:"🔙 Назад",callback_data:"back_main"}]
  ]};
}

function getInflationKB() {
  return {inline_keyboard: [
    [{text:"🇷🇺 Россия",callback_data:"inflation_Россия"},{text:"🇺🇸 США",callback_data:"inflation_США"}],
    [{text:"🇧🇬 Болгария",callback_data:"inflation_Болгария"}],
    [{text:"🔙 Назад",callback_data:"back_main"}]
  ]};
}

function getTutorKB() { return {inline_keyboard: [[{text:"💰 Купить",callback_data:"pay_tutor"}],[{text:"🔙 Назад",callback_data:"back_main"}]]}; }

function getPaidKB() {
  return {inline_keyboard: [
    [{text:"🎓 AI-репетитор — 99⭐",callback_data:"pay_tutor"}],
    [{text:"📝 ДЗ — 29⭐",callback_data:"pay_homework"}],
    [{text:"📚 Экзамен — 149⭐",callback_data:"pay_exam"}],
    [{text:"✍️ Сочинение — 49⭐",callback_data:"pay_essay"}],
    [{text:"⭐ PREMIUM — 299⭐",callback_data:"pay_premium"}],
    [{text:"🔙 Назад",callback_data:"back_main"}]
  ]};
}

function getBuyKB(feature) { return {inline_keyboard: [[{text:"💳 Купить",callback_data:"buy_"+feature}],[{text:"🔙 Назад",callback_data:"paid_main"}]]}; }
function getBackKB() { return {inline_keyboard: [[{text:"🔙 В меню",callback_data:"back_main"}]]}; }
function getHelpKB() { return {inline_keyboard: [[{text:"🔙 Меню",callback_data:"back_main"}]]}; }

async function sendKB(env, chatId, text, kb, msgId = null) {
  try {
    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({chat_id: chatId, text: text, parse_mode: "Markdown", reply_markup: JSON.stringify(kb), reply_to_message_id: msgId})
    });
  } catch(e) { console.error(e); }
}

function sendMsg(token, chatId, text) {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST", headers: {"Content-Type": "application/json"},
    body: JSON.stringify({chat_id: chatId, text: text, parse_mode: "Markdown"})
  }).then(r => r.json());
}

async function ai(env, text) {
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", headers: {"Authorization": "Bearer " + env.OPENROUTER_API_KEY, "Content-Type": "application/json"},
      body: JSON.stringify({model: "mistralai/mistral-7b-instruct:free", messages: [{role:"user",content:text}], max_tokens: 800})
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "Не могу ответить";
  } catch(e) { return "Ошибка: " + e.message; }
}
