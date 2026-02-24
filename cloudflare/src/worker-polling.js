/**
 * AI Digest Bot - Cloudflare Workers with Long Polling
 * Обход блокировки Telegram webhook через polling
 */
const BOT_TOKEN = "8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc";
const ADMIN_IDS = ["1271633868"];

// Простой кэш для offset
let lastUpdateId = 0;

// Клавиатуры
const mainKB = {inline_keyboard: [
  [{text:"🏫 Школа",callback_data:"school_main"},{text:"🎓 ВУЗ",callback_data:"uni_main"}],
  [{text:"🌿 Сад",callback_data:"garden_main"},{text:"🎓 AI",callback_data:"tutor_main"}],
  [{text:"💰 Инвест",callback_data:"invest_main"},{text:"₿ Крипта",callback_data:"crypto_main"}],
  [{text:"🌤️ Погода",callback_data:"weather_main"},{text:"📊 Инфляция",callback_data:"inflation_main"}]
]};

const helpKB = {inline_keyboard: [[{text:"📚 Категории",callback_data:"categories"}],[{text:"🔙 Назад",callback_data:"back"}]]};

// Отправка сообщения
async function sendMessage(chatId, text, replyMarkup) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const body = {chat_id: chatId, text, parse_mode: "Markdown"};
  if (replyMarkup) body.reply_markup = JSON.stringify(replyMarkup);
  
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body)
    });
    return await r.json();
  } catch(e) {
    console.error("sendMessage error:", e);
    return null;
  }
}

// Обработка команд
async function handleCommand(msg) {
  const chatId = msg.chat.id;
  const text = msg.text;
  const name = msg.from?.first_name || "User";
  
  if (text === "/start") {
    return sendMessage(chatId, `👋 Привет, ${name}!\n\nЯ Aiden PRO в Cloudflare!\n\n🏫 Школа + ВУЗ\n🌿 Сад\n🎓 AI\n💰 Инвестиции\n🌤️ Погода\n\nЖми кнопки!`, mainKB);
  }
  
  if (text === "/help") {
    return sendMessage(chatId, "📖 СПРАВКА\n\n/start — меню\n/help — справка\n/categories — категории\n/tutor — репетитор\n/language — языки\n\nAdmin бесплатно!", helpKB);
  }
  
  if (text === "/categories") {
    return sendMessage(chatId, "📚 Категории:", mainKB);
  }
  
  if (text === "/tutor") {
    return sendMessage(chatId, "🎓 AI Репетитор\n\nAdmin: Бесплатно!", {inline_keyboard: [[{text:"📐 Математика",callback_data:"tutor_math"}],[{text:"📖 Русский",callback_data:"tutor_russian"}]]});
  }
  
  if (text === "/language") {
    return sendMessage(chatId, "🗣️ Языки\n\n🇬🇧 English\n🇧🇬 Български\n🇩🇪 Deutsch\n\nAdmin бесплатно!", {inline_keyboard: [[{text:"🇬🇧 English",callback_data:"lang_en"},{text:"🇧🇬 Български",callback_data:"lang_bg"}]]});
  }
  
  if (text === "/lawyer_ru") {
    return sendMessage(chatId, "⚖️ AI Юрист РФ\n\nГК РФ, УК РФ, ТК РФ\nAdmin бесплатно!");
  }
  
  if (text === "/lawyer_bg") {
    return sendMessage(chatId, "⚖️ AI Юрист BG\n\nЗЗД, НК, КТ\nAdmin бесплатно!");
  }
  
  if (text === "/weather") {
    return sendMessage(chatId, "🌤️ Погода\n\nОтправьте /weather Москва");
  }
  
  if (text.startsWith("/weather ")) {
    const city = text.replace("/weather ", "");
    // Простая погода без API
    return sendMessage(chatId, `🌤️ ${city}\n\n🌡️ +20°C\n☀️ Ясно\n💨 5 м/с`);
  }
  
  if (text === "/crypto") {
    return sendMessage(chatId, "₿ Криптовалюты\n\nBTC: $67000\nETH: $3500\nSOL: $145");
  }
  
  if (text === "/invest") {
    return sendMessage(chatId, "💰 Инвестиции\n\nSBER: 285₽\nGAZP: 175₽\nLKOH: 6850₽");
  }
  
  return null;
}

// Обработка кнопок
async function handleCallback(cb) {
  const chatId = cb.message.chat.id;
  const data = cb.data;
  
  // Answer callback
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({callback_query_id: cb.id})
  }).catch(()=>{});
  
  let reply = "", kb = null;
  
  if (data === "back") { reply = "🔙 Меню"; kb = mainKB; }
  else if (data === "categories") { reply = "📚 Категории"; kb = mainKB; }
  else if (data === "school_main") { reply = "🏫 ШКОЛА"; kb = {inline_keyboard: [[{text:"Математика",callback_data:"school_math"}],[{text:"Русский",callback_data:"school_russian"}]]}; }
  else if (data === "uni_main") { reply = "🎓 ВУЗ"; kb = {inline_keyboard: [[{text:"Вышмат",callback_data:"uni_math"}],[{text:"Физика",callback_data:"uni_phys"}]]}; }
  else if (data === "garden_main") { reply = "🌿 САД"; kb = {inline_keyboard: [[{text:"Томаты",callback_data:"garden_tomato"}],[{text:"Огурцы",callback_data:"garden_cucumber"}]]}; }
  else if (data === "tutor_main") { reply = "🎓 AI Репетитор"; kb = {inline_keyboard: [[{text:"Математика",callback_data:"tutor_math"}],[{text:"Русский",callback_data:"tutor_russian"}]]}; }
  else if (data === "invest_main") { reply = "💰 Инвест"; kb = {inline_keyboard: [[{text:"Акции",callback_data:"invest_stocks"}]]}; }
  else if (data === "crypto_main") { reply = "₿ Крипта"; kb = {inline_keyboard: [[{text:"Биткоин",callback_data:"crypto_btc"}]]}; }
  else if (data === "weather_main") { reply = "🌤️ Погода"; kb = {inline_keyboard: [[{text:"Москва",callback_data:"weather_msk"}]]}; }
  else if (data === "inflation_main") { reply = "📊 Инфляция"; kb = {inline_keyboard: [[{text:"Россия",callback_data:"infl_ru"}]]}; }
  else if (data.startsWith("school_")) { reply = `🏫 ${data}`; kb = {inline_keyboard: [[{text:"🔙 Назад",callback_data:"school_main"}]]}; }
  else if (data.startsWith("uni_")) { reply = `🎓 ${data}`; kb = {inline_keyboard: [[{text:"🔙 Назад",callback_data:"uni_main"}]]}; }
  else if (data.startsWith("garden_")) { reply = `🌿 ${data}`; kb = {inline_keyboard: [[{text:"🔙 Назад",callback_data:"garden_main"}]]}; }
  else if (data.startsWith("tutor_")) { reply = `🎓 ${data}`; kb = {inline_keyboard: [[{text:"🔙 Назад",callback_data:"tutor_main"}]]}; }
  else if (data.startsWith("invest_")) { reply = `💰 ${data}`; kb = {inline_keyboard: [[{text:"🔙 Назад",callback_data:"invest_main"}]]}; }
  else if (data.startsWith("crypto_")) { reply = `₿ ${data}`; kb = {inline_keyboard: [[{text:"🔙 Назад",callback_data:"crypto_main"}]]}; }
  else if (data.startsWith("weather_")) { reply = `🌤️ ${data}`; kb = {inline_keyboard: [[{text:"🔙 Назад",callback_data:"weather_main"}]]}; }
  else if (data.startsWith("infl_")) { reply = `📊 ${data}`; kb = {inline_keyboard: [[{text:"🔙 Назад",callback_data:"inflation_main"}]]}; }
  else { reply = "Меню"; kb = mainKB; }
  
  if (reply) {
    return sendMessage(chatId, reply, kb);
  }
  return null;
}

// Long polling
async function pollUpdates() {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30&allowed_updates=["message","callback_query"]`;
    const r = await fetch(url, {timeout: 35000});
    const data = await r.json();
    
    if (data.ok && data.result) {
      for (const update of data.result) {
        lastUpdateId = update.update_id;
        
        if (update.message) {
          await handleCommand(update.message);
        }
        
        if (update.callback_query) {
          await handleCallback(update.callback_query);
        }
      }
    }
  } catch(e) {
    console.error("Poll error:", e);
  }
}

export default {
  async fetch(request, env, ctx) {
    // GET - тест
    if (request.method === "GET") {
      const url = new URL(request.url);
      if (url.searchParams.get("test") === "send") {
        const chatId = url.searchParams.get("chat") || "1271633868";
        await sendMessage(chatId, "✅ TEST OK from Cloudflare Worker!");
        return new Response(`Test sent to ${chatId}`);
      }
      
      // Статус
      return new Response(`Bot OK\nPolling: ${lastUpdateId > 0 ? "Active" : "Starting"}`);
    }
    
    // POST - webhook (резервный вариант)
    if (request.method === "POST") {
      try {
        const update = await request.json();
        if (update.message) {
          await handleCommand(update.message);
        }
        if (update.callback_query) {
          await handleCallback(update.callback_query);
        }
        return new Response("OK");
      } catch(e) {
        return new Response("Error: " + e.message);
      }
    }
    
    return new Response("Bot OK");
  },
  
  // Cron - polling каждые 30 секунд
  async scheduled(event, env, ctx) {
    console.log("Cron polling:", event.scheduledTime);
    ctx.waitUntil(pollUpdates());
  }
};
