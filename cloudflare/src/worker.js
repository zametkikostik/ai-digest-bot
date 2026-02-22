/**
 * AI Digest Bot - REFERRAL + PAID ACCESS
 * Рефералы + Платные функции (Telegram Stars)
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
  "weather_София": "🌤️ **СОФИЯ**\n\n🌡️ +19°C\n☀️ Ясно\n💨 4 м/с"
};

const SCHOOL = ["Математика","Русский язык","Литература","Физика","Химия","Биология","География","История","Обществознание","Информатика","Английский","Немецкий","ОБЖ"];
const UNI = ["Высшая математика","Физика","Химия","Программирование","Базы данных","Сети","Экономика","Менеджмент","Право","Философия","Психология"];

// Реферальная система
const REFERRAL_REWARD = 50; // 50 звёзд за покупку

// Платные функции
const PAID_FEATURES = {
  "tutor": {name: "AI-репетитор", price: 99, duration: "1 месяц", desc: "Персональная помощь с предметами"},
  "homework": {name: "Проверка ДЗ", price: 29, duration: "1 проверка", desc: "Разбор ошибок с рекомендациями"},
  "exam": {name: "Подготовка к экзамену", price: 149, duration: "2 недели", desc: "ЕГЭ, ОГЭ, сессия"},
  "essay": {name: "Проверка сочинений", price: 49, duration: "1 сочинение", desc: "Разбор + рекомендации"},
  "premium": {name: "PREMIUM доступ", price: 299, duration: "1 месяц", desc: "Все функции безлимитно"}
};

export default {
  async fetch(request, env) {
    if (request.method === "GET") return new Response("Bot OK + Paid Access");
    
    if (request.method === "POST") {
      const update = await request.json();
      
      // Кнопки — МГНОВЕННО
      if (update.callback_query) {
        const cb = update.callback_query;
        const data = cb.data;
        const chatId = cb.message.chat.id;
        const msgId = cb.message.message_id;
        const userId = cb.from.id.toString();
        
        let reply = "";
        let kb = null;
        
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
          const hasAccess = await checkTutorAccess(env, userId);
          if (hasAccess) {
            reply = "🎓 **AI-РЕПЕТИТОР**\n\n✅ У вас активная подписка!\n\nНапиши предмет и задачу — объясню!";
          } else {
            reply = "🎓 **AI-РЕПЕТИТОР**\n\n💰 3 дня бесплатно!\n\nПригласи друзей — получи звёзды!";
          }
          kb = getTutorKB();
        } else if (data === "paid_main") {
          reply = "💎 **ПЛАТНЫЕ ФУНКЦИИ**\n\nВыберите функцию:";
          kb = getPaidKB();
        } else if (data === "referral_main") {
          const refData = await getReferralData(env, userId);
          // Показываем ТОЛЬКО кто КУПИЛ (не триал)
          const paidReferrals = await getPaidReferrals(env, refData.referrals);
          
          reply = `👥 **РЕФЕРАЛЬНАЯ СИСТЕМА**\n\n` +
            `👥 Всего пригласили: ${refData.referrals.length}\n` +
            `💰 **Купили подписку**: ${paidReferrals.length}\n` +
            `⭐ Заработано: ${refData.earned} звёзд\n\n` +
            `💰 **Награда**: 50 звёзд за покупку!\n\n`;
          
          if (paidReferrals.length > 0) {
            reply += `**Купили**:\n${paidReferrals.map(r => `• ${r}`).join('\n')}\n\n`;
          }
          
          reply += `🔗 Ваша ссылка:\n\`https://t.me/AidenHelpbot?start=ref_${userId}\``;
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
        } else if (data.startsWith("pay_")) {
          const feature = data.replace("pay_", "");
          const f = PAID_FEATURES[feature];
          if (f) {
            reply = `💎 **{f.name}**\n\n` +
              `📝 ${f.desc}\n\n` +
              `💰 Цена: **{f.price} звёзд**\n` +
              `⏱️ {f.duration}\n\n` +
              `Нажмите [Купить] для оплаты!`;
            kb = getBuyKB(feature);
          } else {
            reply = "❌ Неизвестная функция";
            kb = getBackKB();
          }
        } else if (data.startsWith("buy_")) {
          const feature = data.replace("buy_", "");
          reply = "💎 **ОПЛАТА**\n\n" +
            "📲 Для оплаты нажмите на кнопку ниже (Telegram Stars)\n\n" +
            "_После оплаты функция активируется автоматически_";
          kb = getPaymentKB(feature);
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
        
        // Обработка реферальной ссылки
        if (text.startsWith("/start ref_")) {
          const referrerId = text.replace("/start ref_", "");
          if (referrerId !== uid) {
            await addReferral(env, uid, referrerId);
            const reply = `✅ Вы подписаны по реферальной ссылке!\n\n` +
              `🎁 Бонус: 3 дня AI-репетитора бесплатно!\n\n` +
              `/tutor — начать занятия\n` +
              `/paid — платные функции`;
            await activateTutor(env, uid, "trial", 3);
            await sendMsg(env.BOT_TOKEN, chatId, reply);
            return new Response("OK");
          }
        }
        
        // Геолокация
        if (msg.location) {
          const reply = "🌤️ **ПОГОДА**\n\n📍 " + msg.location.latitude.toFixed(2) + ", " + msg.location.longitude.toFixed(2);
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
💎 Платные функции
💰 Инвестиции
₿ Крипта
📊 Бизнес
🌤️ Погода

**Жми кнопки!**

👥 Пригласи друзей — получи 50 звёзд!
/ref — твоя ссылка`;
          await sendKB(env, chatId, reply, getMainKB());
          return new Response("OK");
        }
        
        if (text === "/help") {
          reply = "📖 **СПРАВКА**\n\n" +
            "/school [предмет]\n" +
            "/university [предмет]\n" +
            "/tutor — AI-репетитор\n" +
            "/paid — платные функции\n" +
            "/ref — реферальная ссылка\n" +
            "/my_tutor — статус подписки\n" +
            "/my_paid — мои покупки\n" +
            "/invest [вопрос]\n" +
            "/weather [город]";
          await sendKB(env, chatId, reply, getHelpKB());
          return new Response("OK");
        }
        
        if (text === "/tutor") {
          const hasAccess = await checkTutorAccess(env, uid);
          if (hasAccess) {
            reply = "🎓 **AI-РЕПЕТИТОР**\n\n✅ У вас активная подписка!\n\nНапиши предмет и задачу — объясню!";
          } else {
            reply = "🎓 **AI-РЕПЕТИТОР**\n\n⚠️ Нет подписки.\n\n💰 3 дня бесплатно!\n\n/paid — купить";
          }
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        if (text === "/paid") {
          reply = "💎 **ПЛАТНЫЕ ФУНКЦИИ**\n\n" +
            "🎓 **AI-репетитор** — 99 звёзд/мес\n" +
            "📝 **Проверка ДЗ** — 29 звёзд\n" +
            "📚 **Подготовка к экзамену** — 149 звёзд\n" +
            "✍️ **Проверка сочинений** — 49 звёзд\n" +
            "⭐ **PREMIUM** — 299 звёзд/мес\n\n" +
            "Нажмите кнопку ниже:";
          await sendKB(env, chatId, reply, getPaidKB());
          return new Response("OK");
        }
        
        if (text === "/my_paid") {
          const paid = await getPaidFeatures(env, uid);
          if (paid.length === 0) {
            reply = "💎 **МОИ ПОКУПКИ**\n\n❌ Нет активных покупок\n\n/paid — купить";
          } else {
            reply = "💎 **МОИ ПОКУПКИ**\n\n";
            paid.forEach(p => {
              reply += `✅ **{p.feature}**\n`;
              reply += `📅 До: ${new Date(p.expires).toLocaleDateString('ru-RU')}\n\n`;
            });
          }
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        if (text === "/ref") {
          const refData = await getReferralData(env, uid);
          const paidReferrals = await getPaidReferrals(env, refData.referrals);
          reply = `👥 **РЕФЕРАЛЬНАЯ СИСТЕМА**\n\n` +
            `👥 Пригласили: ${refData.referrals.length}\n` +
            `💰 **Купили**: ${paidReferrals.length}\n` +
            `⭐ Заработано: ${refData.earned} звёзд\n\n` +
            `💰 **50 звёзд** за каждую покупку!\n\n` +
            `🔗 Ваша ссылка:\n\`https://t.me/AidenHelpbot?start=ref_${uid}\``;
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        if (text === "/my_tutor") {
          const status = await getTutorStatus(env, uid);
          reply = "🎓 **СТАТУС**\n\n" + status;
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
          reply = `🌤️ **{city}**\n\nЗагрузка...`;
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

// === РЕФЕРАЛЬНАЯ СИСТЕМА ===

async function getReferralData(env, userId) {
  try {
    const key = `ref_${userId}`;
    const data = await env.RAG_STORE.get(key);
    if (!data) return {referrer: null, referrals: [], earned: 0};
    return JSON.parse(data);
  } catch(e) { return {referrer: null, referrals: [], earned: 0}; }
}

async function addReferral(env, userId, referrerId) {
  try {
    await env.RAG_STORE.put(`ref_${userId}`, JSON.stringify({referrer: referrerId, referrals: [], earned: 0}));
    const refData = await getReferralData(env, referrerId);
    if (!refData.referrals.includes(userId)) {
      refData.referrals.push(userId);
      await env.RAG_STORE.put(`ref_${referrerId}`, JSON.stringify(refData));
    }
  } catch(e) { console.error(e); }
}

async function getPaidReferrals(env, referrals) {
  const paid = [];
  for (const refId of referrals) {
    const hasPaid = await checkTutorAccess(env, refId);
    if (hasPaid) paid.push(refId);
  }
  return paid;
}

async function payReferralReward(env, userId) {
  try {
    const userData = await getReferralData(env, userId);
    if (userData.referrer) {
      const referrerData = await getReferralData(env, userData.referrer);
      referrerData.earned += REFERRAL_REWARD;
      await env.RAG_STORE.put(`ref_${userData.referrer}`, JSON.stringify(referrerData));
      await sendMsg(env.BOT_TOKEN, userData.referrer, 
        `⭐ **+${REFERRAL_REWARD} звёзд**!\n\nВаш реферал купил подписку!\nВсего: ${referrerData.earned} звёзд`);
    }
  } catch(e) { console.error(e); }
}

// === AI-РЕПЕТИТОР ===

async function checkTutorAccess(env, userId) {
  try {
    const key = `tutor_${userId}`;
    const data = await env.RAG_STORE.get(key);
    if (!data) return false;
    const sub = JSON.parse(data);
    return new Date() < new Date(sub.expires);
  } catch(e) { return false; }
}

async function getTutorStatus(env, userId) {
  try {
    const key = `tutor_${userId}`;
    const data = await env.RAG_STORE.get(key);
    if (!data) return "❌ Нет подписки\n\n/paid — купить";
    const sub = JSON.parse(data);
    const expiry = new Date(sub.expires);
    const days = Math.ceil((expiry - new Date()) / (1000*60*60*24));
    return `✅ **{sub.plan}**\n\n📅 До: ${expiry.toLocaleDateString('ru-RU')}\n⏳ Осталось: ${days} дн.`;
  } catch(e) { return "Ошибка"; }
}

async function activateTutor(env, userId, plan, days) {
  try {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    await env.RAG_STORE.put(`tutor_${userId}`, JSON.stringify({userId, plan, expires: expires.toISOString(), activated: new Date().toISOString()}));
    if (plan !== "trial") await payReferralReward(env, userId);
    return true;
  } catch(e) { return false; }
}

// === ПЛАТНЫЕ ФУНКЦИИ ===

async function getPaidFeatures(env, userId) {
  try {
    const key = `paid_${userId}`;
    const data = await env.RAG_STORE.get(key);
    if (!data) return [];
    return JSON.parse(data);
  } catch(e) { return []; }
}

async function activatePaidFeature(env, userId, feature) {
  try {
    const f = PAID_FEATURES[feature];
    if (!f) return false;
    
    let days = 30;
    if (feature === "homework" || feature === "essay") days = 1;
    if (feature === "exam") days = 14;
    
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    
    const paid = await getPaidFeatures(env, userId);
    paid.push({feature: f.name, expires: expires.toISOString()});
    await env.RAG_STORE.put(`paid_${userId}`, JSON.stringify(paid));
    
    // Рефереру
    await payReferralReward(env, userId);
    
    return true;
  } catch(e) { return false; }
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

function getInvestKB() {
  return {inline_keyboard: [[{text:"Акции",callback_data:"invest_Акции"}],[{text:"🔙 Назад",callback_data:"back_main"}]]};
}

function getCryptoKB() {
  return {inline_keyboard: [[{text:"Биткоин",callback_data:"crypto_Биткоин"}],[{text:"🔙 Назад",callback_data:"back_main"}]]};
}

function getBusinessKB() {
  return {inline_keyboard: [[{text:"Стартап",callback_data:"business_Стартап"}],[{text:"🔙 Назад",callback_data:"back_main"}]]};
}

function getWeatherKB() {
  return {inline_keyboard: [[{text:"🇷🇺 Москва",callback_data:"weather_Москва"},{text:"🇧🇬 София",callback_data:"weather_София"}],[{text:"🔙 Назад",callback_data:"back_main"}]]};
}

function getInflationKB() {
  return {inline_keyboard: [[{text:"🇷🇺 Россия",callback_data:"inflation_Россия"},{text:"🇺🇸 США",callback_data:"inflation_США"}],[{text:"🇧🇬 Болгария",callback_data:"inflation_Болгария"}],[{text:"🔙 Назад",callback_data:"back_main"}]]};
}

function getTutorKB() {
  return {inline_keyboard: [[{text:"💰 Купить подписку",callback_data:"pay_tutor"}],[{text:"📖 Справка",callback_data:"help_main"}],[{text:"🔙 Назад",callback_data:"back_main"}]]};
}

function getPaidKB() {
  return {inline_keyboard: [
    [{text:"🎓 AI-репетитор — 99⭐",callback_data:"pay_tutor"}],
    [{text:"📝 Проверка ДЗ — 29⭐",callback_data:"pay_homework"}],
    [{text:"📚 Экзамен — 149⭐",callback_data:"pay_exam"}],
    [{text:"✍️ Сочинение — 49⭐",callback_data:"pay_essay"}],
    [{text:"⭐ PREMIUM — 299⭐",callback_data:"pay_premium"}],
    [{text:"🔙 Назад",callback_data:"back_main"}]
  ]};
}

function getBuyKB(feature) {
  return {inline_keyboard: [[{text:"💳 Купить",callback_data:"buy_"+feature}],[{text:"🔙 Назад",callback_data:"paid_main"}]]};
}

function getPaymentKB(feature) {
  return {inline_keyboard: [
    [{text:"💳 Оплатить "+PAID_FEATURES[feature].price+"⭐",callback_data:"pay_confirm_"+feature}],
    [{text:"🔙 Назад",callback_data:"paid_main"}]
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
