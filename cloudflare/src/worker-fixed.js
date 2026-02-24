/**
 * AI Digest Bot - Cloudflare Workers
 * Исправленная версия для работы с Telegram webhook
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
  "inflation_Россия": "📊 РОССИЯ\n\n💹 Инфляция: 7.8%",
  "inflation_Болгария": "📊 БОЛГАРИЯ\n\n💹 Инфляция: 4.8%",
  "inflation_США": "📊 США\n\n💹 Инфляция: 3.1%",
  "garden_Томаты": "🍅 ТОМАТЫ\n\n🌱 Посев: март-апрель\n🌿 Высадка: май-июнь\n💧 Полив: 2-3 раза/неделю\n☀️ Свет: 6-8 часов",
  "garden_Огурцы": "🥒 ОГУРЦЫ\n\n🌱 Посев: апрель-май\n🌿 Высадка: май-июнь\n💧 Полив: ежедневно\n☀️ Свет: 4-6 часов"
};

const SCHOOL = ["Математика","Русский язык","Литература","Физика","Химия","Биология","География","История","Обществознание","Информатика","Английский","Немецкий","ОБЖ"];
const UNI = ["Высшая математика","Физика","Химия","Программирование","Базы данных","Сети","Экономика","Менеджмент","Право","Философия","Психология"];
const GARDEN = [
  {name: "🍅 Томаты", id: "Томаты"},
  {name: "🥒 Огурцы", id: "Огурцы"},
  {name: "🫑 Перец", id: "Перец"},
  {name: "🥕 Морковь", id: "Морковь"},
  {name: "🥔 Картофель", id: "Картофель"},
  {name: "🥬 Капуста", id: "Капуста"},
  {name: "🧅 Лук", id: "Лук"},
  {name: "🧄 Чеснок", id: "Чеснок"},
  {name: "🍓 Клубника", id: "Клубника"},
  {name: "🍎 Яблоня", id: "Яблоня"},
  {name: "🫐 Смородина", id: "Смородина"},
  {name: "🍇 Малина", id: "Малина"},
  {name: "🌸 Цветы", id: "Цветы"},
  {name: "🌿 Газон", id: "Газон"},
  {name: "🧪 Удобрения", id: "Удобрения"},
  {name: "🐛 Вредители", id: "Вредители"},
  {name: "🦠 Болезни", id: "Болезни"},
  {name: "📅 Календарь", id: "Календарь"}
];

const PAID_FEATURES = {
  "tutor": {name: "AI-репетитор", price: 99, duration: "1 месяц"},
  "homework": {name: "Проверка ДЗ", price: 29, duration: "1 проверка"},
  "exam": {name: "Экзамен", price: 149, duration: "2 недели"},
  "essay": {name: "Сочинение", price: 49, duration: "1 шт"},
  "premium": {name: "PREMIUM", price: 299, duration: "1 месяц"}
};

// POST TEMPLATES
const POST_TEMPLATES = {
  morning: ["🌅 ДОБРОЕ УТРО!\n\n{content}\n\n💡 Примени сегодня!"],
  afternoon: ["📊 ДНЕВНОЙ ДАЙДЖЕСТ\n\n{content}\n\n💼 Используй на практике!"],
  evening: ["🌙 ВЕЧЕРНИЙ РАЗБОР\n\n{content}\n\n📚 Изучи перед сном!"]
};

const POST_TOPICS = ["Нейросети 2026", "AI инструменты", "Промпт-инжиниринг", "Автоматизация", "Машинное обучение"];

// KEYBOARD FUNCTIONS
function mainKB() { return {inline_keyboard: [[{text:"🏫 Школа",callback_data:"school_main"},{text:"🎓 ВУЗ",callback_data:"uni_main"}],[{text:"🌿 Сад",callback_data:"garden_main"},{text:"🎓 AI",callback_data:"tutor_main"}],[{text:"💎 PREMIUM",callback_data:"paid_main"},{text:"👥 Рефералы",callback_data:"referral_main"}],[{text:"💰 Инвест",callback_data:"invest_main"},{text:"₿ Крипта",callback_data:"crypto_main"}],[{text:"📊 Бизнес",callback_data:"business_main"}],[{text:"🌤️ Погода",callback_data:"weather_main"},{text:"📊 Инфляция",callback_data:"inflation_main"}]]}; }
function schoolKB() { const kb=[]; let row=[]; for(let i=0;i<SCHOOL.length;i++){row.push({text:SCHOOL[i],callback_data:"school_"+SCHOOL[i]});if(row.length===2||i===SCHOOL.length-1){kb.push(row);row=[];}} kb.push([{text:"🔙 Назад",callback_data:"back_main"}]); return {inline_keyboard: kb}; }
function uniKB() { const kb=[]; let row=[]; for(let i=0;i<UNI.length;i++){row.push({text:UNI[i],callback_data:"uni_"+UNI[i]});if(row.length===2||i===UNI.length-1){kb.push(row);row=[];}} kb.push([{text:"🔙 Назад",callback_data:"back_main"}]); return {inline_keyboard: kb}; }
function gardenKB() { const kb=[]; let row=[]; for(let i=0;i<GARDEN.length;i++){row.push({text:GARDEN[i].name,callback_data:"garden_"+GARDEN[i].id});if(row.length===2||i===GARDEN.length-1){kb.push(row);row=[];}} kb.push([{text:"🔙 Назад",callback_data:"back_main"}]); return {inline_keyboard: kb}; }
function gardenBackKB() { return {inline_keyboard: [[{text:"🌿 Все культуры",callback_data:"garden_main"}],[{text:"🔙 В меню",callback_data:"back_main"}]]}; }
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

// HELPER FUNCTIONS
async function sendMsg(token, chatId, text, kb) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = {chat_id: chatId, text, parse_mode: "Markdown"};
  if (kb) body.reply_markup = JSON.stringify(kb);
  try {
    const r = await fetch(url, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)});
    return await r.json();
  } catch(e) { console.error("sendMsg error:", e); return null; }
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
  } catch(e) { return "Ошибка AI"; }
}

async function checkTutor(env, userId) {
  try { const d = await env.RAG_STORE.get(`tutor_${userId}`); if (!d) return false; return new Date() < new Date(JSON.parse(d).expires); }
  catch(e) { return false; }
}

async function activateTutor(env, userId, plan, days) {
  const exp = new Date(); exp.setDate(exp.getDate() + days);
  await env.RAG_STORE.put(`tutor_${userId}`, JSON.stringify({userId, plan, expires: exp.toISOString()}));
}

async function getRefData(env, userId) {
  try { const d = await env.RAG_STORE.get(`ref_${userId}`); return d ? JSON.parse(d) : {referrer:null, referrals:[], earned:0}; }
  catch(e) { return {referrer:null, referrals:[], earned:0}; }
}

async function addRef(env, uid, refId) {
  try {
    await env.RAG_STORE.put(`ref_${uid}`, JSON.stringify({referrer:refId, referrals:[], earned:0}));
    const ref = await getRefData(env, refId);
    if (!ref.referrals.includes(uid)) { ref.referrals.push(uid); await env.RAG_STORE.put(`ref_${refId}`, JSON.stringify(ref)); }
  } catch(e) {}
}

async function ragSearch(env, query) {
  try {
    const allKeys = [];
    let cursor = null;
    do {
      const result = await env.RAG_STORE.list({prefix: "knowledge_", cursor, limit: 100});
      allKeys.push(...result.keys);
      cursor = result.cursor;
    } while (cursor);
    if (allKeys.length === 0) return "📚 База знаний пуста.";
    const queryLower = query.toLowerCase();
    const results = [];
    for (const keyInfo of allKeys) {
      const content = await env.RAG_STORE.get(keyInfo.name);
      if (content && content.toLowerCase().includes(queryLower)) {
        results.push(`📄 ${keyInfo.name}: ${content.substring(0, 200)}...`);
      }
    }
    if (results.length === 0) return await ai(env, `Ответь кратко на: ${query}`);
    return `🔍 Найдено: ${results.length}\n\n` + results.slice(0, 5).join("\n\n");
  } catch(e) { return "❌ Ошибка поиска"; }
}

async function getWeather(lat, lon) {
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const d = await r.json();
    const cw = d.current_weather || {};
    const codes = {0:"☀️",1:"🌤️",2:"☁️",3:"☁️",45:"🌫️",48:"🌫️",51:"🌧️",53:"🌧️",55:"🌧️",61:"🌧️",63:"🌧️",65:"🌧️",71:"🌨️",73:"🌨️",75:"🌨️",95:"⛈️"};
    return {temp: cw.temperature || "N/A", cond: codes[cw.weathercode] || "🌤️", wind: cw.windspeed || "N/A"};
  } catch(e) { return {temp: "N/A", cond: "Ошибка", wind: "N/A"}; }
}

async function getWeatherByCity(city) {
  const coords = {"москва":[55.75,37.62],"спб":[59.93,30.33],"казань":[55.79,49.12],"екатеринбург":[56.84,60.61],"новосибирск":[55.00,82.93],"сочи":[43.60,39.73],"минск":[53.90,27.56],"алматы":[43.25,76.95],"софия":[42.69,23.32],"лондон":[51.50,-0.12],"париж":[48.85,2.35],"берлин":[52.52,13.41],"нью-йорк":[40.71,-74.01]};
  const c = coords[city.toLowerCase()] || [55.75, 37.62];
  return await getWeather(c[0], c[1]);
}

// MAIN WORKER
export default {
  async fetch(request, env, ctx) {
    // Проверка secret_token от Telegram
    const secretToken = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (secretToken && secretToken !== "MySecretToken123") {
      return new Response("Unauthorized", { status: 401 });
    }

    if (request.method === "GET") {
      const url = new URL(request.url);
      if (url.searchParams.get("test") === "send") {
        const chatId = url.searchParams.get("chat") || "1271633868";
        await sendMsg(env.BOT_TOKEN, chatId, "✅ TEST OK from Cloudflare Worker!");
        return new Response(`Test sent to ${chatId}`);
      }
      return new Response("Bot OK - https://github.com/zametkikostik/ai-digest-bot");
    }

    if (request.method === "POST") {
      try {
        const update = await request.json();
        console.log("Received update:", JSON.stringify(update).substring(0, 200));

        // Callback query (кнопки)
        if (update.callback_query) {
          const cb = update.callback_query;
          const data = cb.data;
          const chatId = cb.message.chat.id;
          
          // Answer callback
          fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/answerCallbackQuery`, {
            method: "POST", headers: {"Content-Type": "application/json"},
            body: JSON.stringify({callback_query_id: cb.id})
          }).catch(()=>{});

          let reply = "", kb = null;
          
          if (QUICK[data]) { reply = QUICK[data]; kb = backKB(); }
          else if (data === "back_main") { reply = "🔙 Меню"; kb = mainKB(); }
          else if (data === "school_main") { reply = "🏫 ШКОЛА"; kb = schoolKB(); }
          else if (data === "uni_main") { reply = "🎓 ВУЗ"; kb = uniKB(); }
          else if (data === "garden_main") { reply = "🌿 САД"; kb = gardenKB(); }
          else if (data === "tutor_main") {
            const has = await checkTutor(env, cb.from.id.toString());
            reply = has ? "✅ Активно!" : "💰 7 дней бесплатно!";
            kb = tutorKB();
          }
          else if (data === "paid_main") { reply = "💎 PREMIUM"; kb = paidKB(); }
          else if (data === "referral_main") {
            const ref = await getRefData(env, cb.from.id.toString());
            reply = `👥 ${ref.referrals.length}\n⭐ ${ref.earned}`;
            kb = backKB();
          }
          else if (data === "invest_main") { reply = "💰 Инвест"; kb = investKB(); }
          else if (data === "crypto_main") { reply = "₿ Крипта"; kb = cryptoKB(); }
          else if (data === "business_main") { reply = "📊 Бизнес"; kb = businessKB(); }
          else if (data === "weather_main") { reply = "🌤️ Погода"; kb = weatherKB(); }
          else if (data === "inflation_main") { reply = "📊 Инфляция"; kb = inflationKB(); }
          else if (data.startsWith("school_")) { reply = `🏫 ${data}`; kb = backKB(); }
          else if (data.startsWith("uni_")) { reply = `🎓 ${data}`; kb = backKB(); }
          else if (data.startsWith("garden_")) { reply = QUICK[data] || data; kb = gardenBackKB(); }
          else if (data.startsWith("pay_")) {
            const f = PAID_FEATURES[data.replace("pay_","")];
            reply = `💎 ${f.name} — ${f.price}⭐`;
            kb = buyKB(data.replace("pay_",""));
          }
          else { reply = "Меню"; kb = mainKB(); }

          if (reply) ctx.waitUntil(sendMsg(env.BOT_TOKEN, chatId, reply, kb));
          return new Response("OK");
        }

        // Messages
        if (update.message) {
          const msg = update.message;
          const chatId = msg.chat.id;
          const text = msg.text || "";
          const name = msg.from?.first_name || "User";
          const uid = msg.from?.id?.toString();

          // Admin commands
          if (text.startsWith("/add ") && ADMIN_IDS.includes(uid)) {
            const content = text.replace("/add ", "");
            await env.RAG_STORE.put(`knowledge_${Date.now()}`, content);
            await sendMsg(env.BOT_TOKEN, chatId, `✅ Добавлено!`);
            return new Response("OK");
          }
          if (text === "/knowledge" && ADMIN_IDS.includes(uid)) {
            const keys = await ragSearch(env, "list");
            await sendMsg(env.BOT_TOKEN, chatId, `📚 База:\n\n${keys}`);
            return new Response("OK");
          }

          // User commands
          if (text === "/start") {
            await sendMsg(env.BOT_TOKEN, chatId, `👋 Привет, ${name}!\n\nЯ Aiden PRO.\n\n🏫 Школа + ВУЗ\n🌿 Сад\n🎓 AI-репетитор\n💰 Инвестиции\n🌤️ Погода\n\nЖми кнопки!`, mainKB());
            return new Response("OK");
          }
          
          if (text === "/help") {
            await sendMsg(env.BOT_TOKEN, chatId, "📖 СПРАВКА\n\n/start — меню\n/help — справка\n/categories — категории\n/tutor — репетитор\n/language — языки\n/lawyer_ru — юрист РФ\n/lawyer_bg — юрист BG\n/search — поиск\n\nAdmin бесплатно!", helpKB());
            return new Response("OK");
          }

          if (text === "/categories") {
            await sendMsg(env.BOT_TOKEN, chatId, "📚 Категории:", mainKB());
            return new Response("OK");
          }

          if (text === "/tutor") {
            const has = await checkTutor(env, uid);
            const reply = has ? "✅ Активно!" : "💰 7 дней бесплатно! (Admin)";
            await sendMsg(env.BOT_TOKEN, chatId, `🎓 AI Репетитор\n\n${reply}`, tutorKB());
            return new Response("OK");
          }

          if (text === "/language") {
            await sendMsg(env.BOT_TOKEN, chatId, "🗣️ Языки\n\n🇬🇧 English\n🇧🇬 Български\n🇩🇪 Deutsch\n🇫🇷 Français\n\n(Admin бесплатно)", {inline_keyboard: [[{text:"🇬🇧 English",callback_data:"lang_en"},{text:"🇧🇬 Български",callback_data:"lang_bg"}],[{text:"🇩🇪 Deutsch",callback_data:"lang_de"}]]});
            return new Response("OK");
          }

          if (text === "/lawyer_ru") {
            await sendMsg(env.BOT_TOKEN, chatId, "⚖️ AI Юрист РФ\n\nГК РФ, УК РФ, ТК РФ, НК РФ\n(Admin бесплатно)");
            return new Response("OK");
          }

          if (text === "/lawyer_bg") {
            await sendMsg(env.BOT_TOKEN, chatId, "⚖️ AI Юрист BG\n\nЗЗД, НК, КТ, ЗКПО\n(Admin бесплатно)");
            return new Response("OK");
          }

          if (text === "/weather" || text.startsWith("/weather ")) {
            const city = text.replace("/weather ", "");
            const w = await getWeatherByCity(city);
            await sendMsg(env.BOT_TOKEN, chatId, `🌤️ ${city}\n\n🌡️ ${w.temp}°C\n${w.cond}\n💨 ${w.wind} м/с`);
            return new Response("OK");
          }

          if (text === "/crypto") {
            await sendMsg(env.BOT_TOKEN, chatId, "₿ Криптовалюты\n\nBTC: $67000\nETH: $3500\nSOL: $145\n(данные примерные)");
            return new Response("OK");
          }

          if (text === "/invest") {
            await sendMsg(env.BOT_TOKEN, chatId, "💰 Инвестиции\n\nSBER: 285₽\nGAZP: 175₽\nLKOH: 6850₽");
            return new Response("OK");
          }

          if (text.startsWith("/search ")) {
            const query = text.replace("/search ", "");
            const result = await ragSearch(env, query);
            await sendMsg(env.BOT_TOKEN, chatId, `🔍 Поиск:\n\n${result}`);
            return new Response("OK");
          }

          if (text.startsWith("/ask ")) {
            const q = text.replace("/ask ", "");
            const answer = await ai(env, q);
            await sendMsg(env.BOT_TOKEN, chatId, `🤖 AI:\n\n${answer}`);
            return new Response("OK");
          }

          // AI для не команд
          if (!text.startsWith("/") && text.length > 5) {
            const answer = await ai(env, text);
            ctx.waitUntil(sendMsg(env.BOT_TOKEN, chatId, answer));
          }

          return new Response("OK");
        }

        return new Response("OK");
      } catch (e) {
        console.error("Error:", e);
        return new Response("Error: " + e.message);
      }
    }

    return new Response("Bot OK");
  },

  // SCHEDULER
  async scheduled(event, env, ctx) {
    console.log("Cron:", event.scheduledTime);
    const topic = POST_TOPICS[Math.floor(Math.random() * POST_TOPICS.length)];
    const content = await ai(env, `Пост про: ${topic}`);
    const templates = POST_TEMPLATES.morning;
    const post = templates[0].replace("{content}", content);
    ctx.waitUntil(sendMsg(env.BOT_TOKEN, CHANNEL_ID, post));
  }
};
