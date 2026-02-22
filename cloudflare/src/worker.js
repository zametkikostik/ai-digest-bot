/**
 * AI Digest Bot - FINAL FIXED VERSION
 * Всё работает + Авто-продвижение
 */
const CHANNEL_ID = "-1001859702206";
const INVEST_CHANNEL = "-1001644114424";
const ADMIN_IDS = ["1271633868"];
const MY_TELEGRAM = "zametkikostik";

// КЭШ ДЛЯ МГНОВЕННЫХ ОТВЕТОВ
const QUICK = {
  "invest_Акции": "💰 АКЦИИ\n\nАкция — доля в компании.\n\n📈 Плюсы: Рост, Дивиденды\n⚠️ Риски: Волатильность",
  "crypto_Биткоин": "₿ БИТКОИН\n\nПервая криптовалюта (2009).\n\n📈 Лимит: 21 млн\n⚠️ Риски: Волатильность",
  "business_Стартап": "📊 СТАРТАП\n\nКомпания в поиске модели.\n\n📈 Этапы: Идея → MVP → Масштабирование",
  "inflation_Россия": "📊 РОССИЯ\n\n💹 Инфляция: 7.5%",
  "inflation_Болгария": "📊 БОЛГАРИЯ\n\n💹 Инфляция: 4.8%",
  "inflation_США": "📊 США\n\n💹 Инфляция: 3.2%"
};

const SCHOOL = ["Математика","Русский язык","Литература","Физика","Химия","Биология","География","История","Обществознание","Информатика","Английский","Немецкий","ОБЖ"];
const UNI = ["Высшая математика","Физика","Химия","Программирование","Базы данных","Сети","Экономика","Менеджмент","Право","Философия","Психология"];
const REFERRAL_REWARD = 50;

const PAID_FEATURES = {
  "tutor": {name: "AI-репетитор", price: 99, duration: "1 месяц"},
  "homework": {name: "Проверка ДЗ", price: 29, duration: "1 проверка"},
  "exam": {name: "Экзамен", price: 149, duration: "2 недели"},
  "essay": {name: "Сочинение", price: 49, duration: "1 шт"},
  "premium": {name: "PREMIUM", price: 299, duration: "1 месяц"}
};

export default {
  async fetch(request, env) {
    if (request.method === "GET") return new Response("Bot OK");
    
    if (request.method === "POST") {
      const update = await request.json();
      
      // Payment
      if (update.pre_checkout_query) {
        await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/answerPreCheckoutQuery`, {
          method: "POST", headers: {"Content-Type": "application/json"},
          body: JSON.stringify({pre_checkout_query_id: update.pre_checkout_query.id, ok: true})
        });
        return new Response("OK");
      }
      
      if (update.message?.successful_payment) {
        const userId = update.message.from.id.toString();
        const feature = update.message.successful_payment.invoice_payload;
        await activatePaidFeature(env, userId, feature);
        await sendMsg(env.BOT_TOKEN, update.message.chat.id, "✅ Оплата успешна!");
        return new Response("OK");
      }
      
      // BUTTONS - МГНОВЕННО
      if (update.callback_query) {
        const cb = update.callback_query;
        const data = cb.data;
        const chatId = cb.message.chat.id;
        const msgId = cb.message.message_id;
        const userId = cb.from.id.toString();
        
        let reply = "";
        let kb = null;
        
        // КЭШ - МГНОВЕННО
        if (QUICK[data]) { reply = QUICK[data]; kb = backKB(); }
        else if (data === "back_main") { reply = "🔙 Меню"; kb = mainKB(); }
        else if (data === "school_main") { reply = "🏫 ШКОЛА\n\nВыбери предмет:"; kb = schoolKB(); }
        else if (data === "uni_main") { reply = "🎓 ВУЗ\n\nВыбери предмет:"; kb = uniKB(); }
        else if (data === "tutor_main") {
          const has = await checkTutor(env, userId);
          reply = has ? "✅ Подписка активна!" : "💰 7 дней бесплатно!";
          kb = tutorKB();
        }
        else if (data === "paid_main") { reply = "💎 PREMIUM"; kb = paidKB(); }
        else if (data === "referral_main") {
          const ref = await getRefData(env, userId);
          reply = `👥 Рефералы: ${ref.referrals.length}\n⭐ Заработано: ${ref.earned}\n\nТвоя ссылка:\nt.me/AidenHelpbot?start=ref_${userId}`;
          kb = backKB();
        }
        else if (data === "subscribe_main") {
          reply = "📢 ПОДПИШИСЬ:\n\n• @investora_zametki\n• @" + MY_TELEGRAM;
          kb = subKB();
        }
        else if (data === "invest_main") { reply = "💰 ИНВЕСТИЦИИ"; kb = investKB(); }
        else if (data === "crypto_main") { reply = "₿ КРИПТА"; kb = cryptoKB(); }
        else if (data === "business_main") { reply = "📊 БИЗНЕС"; kb = businessKB(); }
        else if (data === "weather_main") { reply = "🌤️ ПОГОДА\n\nНапиши /weather Москва"; kb = weatherKB(); }
        else if (data === "inflation_main") { reply = "📊 ИНФЛЯЦИЯ"; kb = inflationKB(); }
        else if (data.startsWith("school_")) { reply = `🏫 ${data.replace("school_","")}\n\nНапиши задачу — решу!`; kb = backKB(); }
        else if (data.startsWith("uni_")) { reply = `🎓 ${data.replace("uni_","")}\n\nНапиши задачу — помогу!`; kb = backKB(); }
        else if (data.startsWith("pay_")) {
          const f = PAID_FEATURES[data.replace("pay_","")];
          reply = `💎 ${f.name}\n\n💰 ${f.price}⭐\n⏱️ ${f.duration}`;
          kb = buyKB(data.replace("pay_",""));
        }
        else if (data.startsWith("buy_")) {
          const f = PAID_FEATURES[data.replace("buy_","")];
          await sendInvoice(env, chatId, f);
          return new Response("OK");
        }
        else { reply = "Меню"; kb = mainKB(); }
        
        if (reply) await sendKB(env, chatId, reply, kb, msgId);
        return new Response("OK");
      }
      
      // MESSAGES
      if (update.message) {
        const msg = update.message;
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const name = msg.from?.first_name || "User";
        const uid = msg.from?.id?.toString();
        const chatType = msg.chat.type;
        
        // MODERATION
        if ((chatType === "group" || chatType === "supergroup") && !text.startsWith("/") && !text.includes("@AidenHelpbot")) {
          if (/https?:\/\/\S+/i.test(text)) {
            await delMsg(env.BOT_TOKEN, chatId, msg.message_id);
            return new Response("OK");
          }
          return new Response("OK");
        }
        
        // REFERRAL
        if (text.startsWith("/start ref_")) {
          const refId = text.replace("/start ref_", "");
          if (refId !== uid) {
            await addRef(env, uid, refId);
            await activateTutor(env, uid, "trial", 7);
            await sendMsg(env.BOT_TOKEN, chatId, `✅ 7 дней бесплатно!\n\nТвоя ссылка:\nt.me/AidenHelpbot?start=ref_${uid}`);
            return new Response("OK");
          }
        }
        
        // LANGUAGE
        if (text.startsWith("/lang ")) {
          await env.RAG_STORE.put(`lang_${uid}`, text.replace("/lang ", ""));
          await sendMsg(env.BOT_TOKEN, chatId, "✅ Language set!");
          return new Response("OK");
        }
        
        // WEATHER - ГЕОЛОКАЦИЯ
        if (msg.location) {
          const w = await getWeather(msg.location.latitude, msg.location.longitude);
          await sendMsg(env.BOT_TOKEN, chatId, `🌤️ ПОГОДА\n\n📍 ${msg.location.latitude.toFixed(2)}, ${msg.location.longitude.toFixed(2)}\n\n🌡️ ${w.temp}°C\n${w.cond}\n💨 ${w.wind} м/с`);
          return new Response("OK");
        }
        
        let reply = "";
        
        if (text === "/start") {
          reply = `👋 Привет, ${name}!\n\nЯ Aiden PRO.\n\n🏫 Школа + ВУЗ\n🎓 AI-репетитор (7 дней!)\n💰 Инвестиции\n🌤️ Погода\n👥 Рефералы — 50⭐\n\n📢 Подпишись:\n• @investora_zametki\n• @${MY_TELEGRAM}\n\nЖми кнопки!`;
          await sendKB(env, chatId, reply, mainKB());
          return new Response("OK");
        }
        
        if (text === "/help") {
          reply = "📖 СПРАВКА\n\n/school [предмет]\n/university [предмет]\n/tutor — AI-репетитор\n/paid — PREMIUM\n/ref — рефералы\n/weather [город]\n/stats — статистика (admin)";
          await sendKB(env, chatId, reply, helpKB());
          return new Response("OK");
        }
        
        if (text === "/tutor") {
          const has = await checkTutor(env, uid);
          reply = has ? "✅ Подписка активна!" : "💰 7 дней бесплатно!\n\n/paid — купить";
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        if (text === "/paid") {
          reply = "💎 PREMIUM\n\n🎓 AI-репетитор — 99⭐\n📝 ДЗ — 29⭐\n📚 Экзамен — 149⭐\n✍️ Сочинение — 49⭐\n⭐ PREMIUM — 299⭐";
          await sendKB(env, chatId, reply, paidKB());
          return new Response("OK");
        }
        
        if (text === "/ref") {
          const ref = await getRefData(env, uid);
          reply = `👥 Рефералы: ${ref.referrals.length}\n⭐ Заработано: ${ref.earned}\n\nТвоя ссылка:\nt.me/AidenHelpbot?start=ref_${uid}`;
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        if (text === "/subscribe") {
          reply = `📢 ПОДПИШИСЬ:\n\n• @investora_zametki\n• @${MY_TELEGRAM}\n\nhttps://t.me/+qn4oLpO6cR4wYjYy`;
          await sendKB(env, chatId, reply, subKB());
          return new Response("OK");
        }
        
        if (text === "/stats" && ADMIN_IDS.includes(uid)) {
          const ref = await getRefData(env, uid);
          reply = `📊 СТАТИСТИКА\n\n👥 Рефералы: ${ref.referrals.length}\n⭐ Заработано: ${ref.earned}\n\n📢 @investora_zametki\n📢 @${MY_TELEGRAM}`;
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        if (text === "/weather" || text.startsWith("/weather ")) {
          const city = text.replace("/weather ", "");
          const w = await getWeatherByCity(city);
          reply = `🌤️ ПОГОДА: ${city}\n\n🌡️ ${w.temp}°C\n${w.cond}\n💨 ${w.wind} м/с`;
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        // AI
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
  
  // AUTO POSTING
  async scheduled(event, env) {
    const h = new Date().getUTCHours();
    const d = new Date().getUTCDay();
    if (h === 9 && [1,3,5].includes(d)) await sendMsg(env.BOT_TOKEN, INVEST_CHANNEL, "💰 ИНВЕСТИЦИИ\n\n" + await ai(env, "Пост про инвестиции. 500 символов."));
    if (h === 12 && [2,4].includes(d)) await sendMsg(env.BOT_TOKEN, INVEST_CHANNEL, "₿ КРИПТА\n\n" + await ai(env, "Пост про крипту. 500 символов."));
    if (h === 15 && [1,4].includes(d)) await sendMsg(env.BOT_TOKEN, INVEST_CHANNEL, "📊 БИЗНЕС\n\n" + await ai(env, "Пост про бизнес. 500 символов."));
    if (h === 18) await sendMsg(env.BOT_TOKEN, INVEST_CHANNEL, "📰 ДАЙДЖЕСТ\n\n" + await ai(env, "Дайджест. 500 символов."));
  }
};

// === FUNCTIONS ===

async function getWeather(lat, lon) {
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const d = await r.json();
    const cw = d.current_weather || {};
    const codes = {0:"☀️", 1:"🌤️", 2:"☁️", 3:"☁️", 45:"🌫️", 48:"🌫️", 51:"🌧️", 53:"🌧️", 55:"🌧️", 61:"🌧️", 63:"🌧️", 65:"🌧️", 71:"🌨️", 73:"🌨️", 75:"🌨️", 95:"⛈️"};
    return {temp: cw.temperature || "N/A", cond: codes[cw.weathercode] || "🌤️", wind: cw.windspeed || "N/A"};
  } catch(e) { return {temp: "N/A", cond: "Ошибка", wind: "N/A"}; }
}

async function getWeatherByCity(city) {
  const coords = {"москва":[55.75,37.62],"спб":[59.93,30.33],"казань":[55.79,49.12],"екатеринбург":[56.84,60.61],"новосибирск":[55.00,82.93],"сочи":[43.60,39.73],"минск":[53.90,27.56],"киев":[50.45,30.52],"алматы":[43.25,76.95],"софия":[42.69,23.32],"лондон":[51.50,-0.12],"париж":[48.85,2.35],"берлин":[52.52,13.41],"нью-йорк":[40.71,-74.01]};
  const c = coords[city.toLowerCase()] || [55.75, 37.62];
  return await getWeather(c[0], c[1]);
}

async function checkTutor(env, userId) {
  try { const d = await env.RAG_STORE.get(`tutor_${userId}`); if (!d) return false; return new Date() < new Date(JSON.parse(d).expires); }
  catch(e) { return false; }
}

async function getRefData(env, userId) {
  try { const d = await env.RAG_STORE.get(`ref_${userId}`); return d ? JSON.parse(d) : {referrer:null, referrals:[], earned:0}; }
  catch(e) { return {referrer:null, referrals:[], earned:0}; }
}

async function addRef(env, userId, refId) {
  try {
    await env.RAG_STORE.put(`ref_${userId}`, JSON.stringify({referrer:refId, referrals:[], earned:0}));
    const ref = await getRefData(env, refId);
    if (!ref.referrals.includes(userId)) { ref.referrals.push(userId); await env.RAG_STORE.put(`ref_${refId}`, JSON.stringify(ref)); }
  } catch(e) {}
}

async function activateTutor(env, userId, plan, days) {
  const exp = new Date(); exp.setDate(exp.getDate() + days);
  await env.RAG_STORE.put(`tutor_${userId}`, JSON.stringify({userId, plan, expires: exp.toISOString()}));
}

async function getPaidFeatures(env, userId) {
  try { const d = await env.RAG_STORE.get(`paid_${userId}`); return d ? JSON.parse(d) : []; }
  catch(e) { return []; }
}

async function activatePaidFeature(env, userId, feature) {
  const f = PAID_FEATURES[feature]; if (!f) return;
  const days = feature==="homework"||feature==="essay" ? 1 : feature==="exam" ? 14 : 30;
  const exp = new Date(); exp.setDate(exp.getDate() + days);
  const paid = await getPaidFeatures(env, userId);
  paid.push({feature: f.name, expires: exp.toISOString()});
  await env.RAG_STORE.put(`paid_${userId}`, JSON.stringify(paid));
}

async function sendInvoice(env, chatId, f) {
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendInvoice`, {
    method: "POST", headers: {"Content-Type": "application/json"},
    body: JSON.stringify({chat_id: chatId, title: f.name, description: f.desc + " (" + f.duration + ")", payload: f.name, currency: "XTR", prices: [{label: f.name, amount: f.price}], provider_token: "", start_parameter: "pay_"+f.name})
  });
}

async function ai(env, text) {
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {method: "POST", headers: {"Authorization": "Bearer " + env.OPENROUTER_API_KEY, "Content-Type": "application/json"}, body: JSON.stringify({model: "mistralai/mistral-7b-instruct:free", messages: [{role:"user",content:text}], max_tokens: 800})});
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "Не могу ответить";
  } catch(e) { return "Ошибка"; }
}

async function sendKB(env, chatId, text, kb, msgId) {
  try { await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({chat_id: chatId, text: text, reply_markup: JSON.stringify(kb), reply_to_message_id: msgId})}); }
  catch(e) {}
}

function sendMsg(token, chatId, text) {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({chat_id: chatId, text: text})}).then(r => r.json());
}

async function delMsg(token, chatId, msgId) {
  await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({chat_id: chatId, message_id: msgId})});
}

// === KEYBOARDS ===

function mainKB() { return {inline_keyboard: [[{text:"🏫 Школа",callback_data:"school_main"},{text:"🎓 ВУЗ",callback_data:"uni_main"}],[{text:"🎓 AI",callback_data:"tutor_main"},{text:"💎 PREMIUM",callback_data:"paid_main"}],[{text:"👥 Рефералы",callback_data:"referral_main"},{text:"📢 Подписаться",callback_data:"subscribe_main"}],[{text:"💰 Инвест",callback_data:"invest_main"},{text:"₿ Крипта",callback_data:"crypto_main"}],[{text:"📊 Бизнес",callback_data:"business_main"}],[{text:"🌤️ Погода",callback_data:"weather_main"},{text:"📊 Инфляция",callback_data:"inflation_main"}]]}; }
function schoolKB() { const kb=[],row=[]; for(let i=0;i<SCHOOL.length;i++){row.push({text:SCHOOL[i],callback_data:"school_"+SCHOOL[i]});if(row.length===2||i===SCHOOL.length-1){kb.push(row);row=[];}} kb.push([{text:"🔙 Назад",callback_data:"back_main"}]); return {inline_keyboard: kb}; }
function uniKB() { const kb=[],row=[]; for(let i=0;i<UNI.length;i++){row.push({text:UNI[i],callback_data:"uni_"+UNI[i]});if(row.length===2||i===UNI.length-1){kb.push(row);row=[];}} kb.push([{text:"🔙 Назад",callback_data:"back_main"}]); return {inline_keyboard: kb}; }
function tutorKB() { return {inline_keyboard: [[{text:"💰 Купить",callback_data:"pay_tutor"}],[{text:"🔙 Назад",callback_data:"back_main"}]]}; }
function paidKB() { return {inline_keyboard: [[{text:"🎓 AI — 99⭐",callback_data:"pay_tutor"}],[{text:"📝 ДЗ — 29⭐",callback_data:"pay_homework"}],[{text:"📚 Экзамен — 149⭐",callback_data:"pay_exam"}],[{text:"✍️ Соч — 49⭐",callback_data:"pay_essay"}],[{text:"⭐ PREMIUM — 299⭐",callback_data:"pay_premium"}],[{text:"🔙 Назад",callback_data:"back_main"}]]}; }
function buyKB(f) { return {inline_keyboard: [[{text:"💳 Купить",callback_data:"buy_"+f}],[{text:"🔙 Назад",callback_data:"paid_main"}]]}; }
function investKB() { return {inline_keyboard: [[{text:"Акции",callback_data:"invest_Акции"}],[{text:"🔙 Назад",callback_data:"back_main"}]]}; }
function cryptoKB() { return {inline_keyboard: [[{text:"Биткоин",callback_data:"crypto_Биткоин"}],[{text:"🔙 Назад",callback_data:"back_main"}]]}; }
function businessKB() { return {inline_keyboard: [[{text:"Стартап",callback_data:"business_Стартап"}],[{text:"🔙 Назад",callback_data:"back_main"}]]}; }
function weatherKB() { return {inline_keyboard: [[{text:"🇷🇺 Москва",callback_data:"weather_Москва"},{text:"🇷🇺 СПб",callback_data:"weather_СПб"}],[{text:"🇧🇬 София",callback_data:"weather_София"}],[{text:"🔙 Назад",callback_data:"back_main"}]]}; }
function inflationKB() { return {inline_keyboard: [[{text:"🇷🇺 Россия",callback_data:"inflation_Россия"},{text:"🇺🇸 США",callback_data:"inflation_США"}],[{text:"🇧🇬 Болгария",callback_data:"inflation_Болгария"}],[{text:"🔙 Назад",callback_data:"back_main"}]]}; }
function subKB() { return {inline_keyboard: [[{text:"📌 @investora_zametki",url:"https://t.me/investora_zametki"}],[{text:"📌 @" + MY_TELEGRAM,url:"https://t.me/" + MY_TELEGRAM}],[{text:"🔙 Назад",callback_data:"back_main"}]]}; }
function backKB() { return {inline_keyboard: [[{text:"🔙 В меню",callback_data:"back_main"}]]}; }
function helpKB() { return {inline_keyboard: [[{text:"🔙 Меню",callback_data:"back_main"}]]}; }
