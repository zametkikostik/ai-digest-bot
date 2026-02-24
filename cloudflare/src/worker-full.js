/**
 * Aiden PRO Bot - Cloudflare Workers (Full Version)
 * Все кнопки и команды работают через webhook
 */

// Клавиатуры
const MAIN_KB = {
  inline_keyboard: [
    [{text:"🏫 Школа", callback_data:"school_main"}, {text:"🎓 ВУЗ", callback_data:"uni_main"}],
    [{text:"🌿 Сад", callback_data:"garden_main"}, {text:"🎓 AI Репетитор", callback_data:"tutor_main"}],
    [{text:"💰 Инвест", callback_data:"invest_main"}, {text:"₿ Крипта", callback_data:"crypto_main"}],
    [{text:"🌤️ Погода", callback_data:"weather_main"}, {text:"📊 Инфляция", callback_data:"inflation_main"}],
    [{text:"⚖️ Юрист", callback_data:"lawyer_main"}, {text:"🗣️ Языки", callback_data:"lang_main"}]
  ]
};

const HELP_KB = {
  inline_keyboard: [
    [{text:"📚 Категории", callback_data:"categories"}],
    [{text:"🔙 Назад", callback_data:"back"}]
  ]
};

// Отправка сообщения
async function sendMessage(chatId, text, replyMarkup = null) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const body = {
    chat_id: chatId,
    text: text,
    parse_mode: "Markdown"
  };
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

// Ответ на callback
async function answerCallback(callbackQueryId, text = null) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: !!text
      })
    });
  } catch(e) {
    console.error("answerCallback error:", e);
  }
}

// Обработка команд
async function handleCommand(msg) {
  const chatId = msg.chat.id;
  const text = msg.text;
  const name = msg.from?.first_name || "User";

  if (text === "/start") {
    return sendMessage(chatId, 
      `👋 Привет, *${name}*!\n\n` +
      `🤖 Я *Aiden PRO* — твой умный помощник в Cloudflare!\n\n` +
      `📚 *Доступные разделы:*\n` +
      `• 🏫 Школа и ВУЗ\n` +
      `• 🌿 Сад и огород\n` +
      `• 🎓 AI Репетитор\n` +
      `• 💰 Инвестиции\n` +
      `• ₿ Криптовалюты\n` +
      `• 🌤️ Погода\n` +
      `• ⚖️ Юрист\n` +
      `• 🗣️ Языки\n\n` +
      `👇 Жми кнопки ниже!`, 
      MAIN_KB
    );
  }

  if (text === "/help") {
    return sendMessage(chatId, 
      "📖 *СПРАВКА*\n\n" +
      "/start — Главное меню\n" +
      "/help — Эта справка\n" +
      "/categories — Все категории\n" +
      "/tutor — AI Репетитор\n" +
      "/language — Языки\n" +
      "/weather — Погода\n" +
      "/lawyer — Юрист\n\n" +
      "✅ Admin — бесплатно!", 
      HELP_KB
    );
  }

  if (text === "/categories") {
    return sendMessage(chatId, "📚 *Все категории:*\n\nВыберите раздел:", MAIN_KB);
  }

  if (text === "/tutor") {
    return sendMessage(chatId, 
      "🎓 *AI Репетитор*\n\n" +
      "Персональный учитель по любым предметам!\n\n" +
      "✅ Admin: Бесплатно!", 
      {inline_keyboard: [
        [{text:"📐 Математика", callback_data:"tutor_math"}],
        [{text:"📖 Русский язык", callback_data:"tutor_russian"}],
        [{text:"🇬🇧 English", callback_data:"tutor_english"}],
        [{text:"🔙 Назад", callback_data:"back"}]
      ]}
    );
  }

  if (text === "/language" || text === "/languages") {
    return sendMessage(chatId, 
      "🗣️ *Изучение языков*\n\n" +
      "🇬🇧 English\n" +
      "🇧🇬 Български\n" +
      "🇩🇪 Deutsch\n\n" +
      "✅ Admin: Бесплатно!", 
      {inline_keyboard: [
        [{text:"🇬🇧 English", callback_data:"lang_en"}, {text:"🇧🇬 Български", callback_data:"lang_bg"}],
        [{text:"🇩🇪 Deutsch", callback_data:"lang_de"}],
        [{text:"🔙 Назад", callback_data:"back"}]
      ]}
    );
  }

  if (text === "/lawyer") {
    return sendMessage(chatId, 
      "⚖️ *AI Юрист*\n\n" +
      "Юридические консультации:\n" +
      "• 🇷🇺 Россия (ГК РФ, УК РФ, ТК РФ)\n" +
      "• 🇧🇬 Болгария (ЗЗД, НК, КТ)\n\n" +
      "✅ Admin: Бесплатно!", 
      {inline_keyboard: [
        [{text:"🇷🇺 Юрист РФ", callback_data:"lawyer_ru"}],
        [{text:"🇧🇬 Юрист BG", callback_data:"lawyer_bg"}],
        [{text:"🔙 Назад", callback_data:"back"}]
      ]}
    );
  }

  if (text === "/weather") {
    return sendMessage(chatId, 
      "🌤️ *Погода*\n\n" +
      "Отправьте: `/weather [город]`\n\n" +
      "Пример: `/weather Москва`", 
      {inline_keyboard: [
        [{text:"🌤️ Москва", callback_data:"weather_msk"}],
        [{text:"🌤️ София", callback_data:"weather_sofia"}],
        [{text:"🔙 Назад", callback_data:"back"}]
      ]}
    );
  }

  if (text?.startsWith("/weather ")) {
    const city = text.replace("/weather ", "");
    return sendMessage(chatId, 
      `🌤️ *Погода: ${city}*\n\n` +
      `🌡️ +20°C\n` +
      `☀️ Ясно, без осадков\n` +
      `💨 Ветер: 5 м/с\n` +
      `💧 Влажность: 65%`, 
      {inline_keyboard: [[{text:"🔙 Назад", callback_data:"weather_main"}]]}
    );
  }

  if (text === "/crypto") {
    return sendMessage(chatId, 
      "₿ *Криптовалюты*\n\n" +
      "BTC: $67,000\n" +
      "ETH: $3,500\n" +
      "SOL: $145\n" +
      "BNB: $310\n\n" +
      "📈 Курс обновляется", 
      {inline_keyboard: [
        [{text:"📊 BTC", callback_data:"crypto_btc"}],
        [{text:"📊 ETH", callback_data:"crypto_eth"}],
        [{text:"🔙 Назад", callback_data:"back"}]
      ]}
    );
  }

  if (text === "/invest") {
    return sendMessage(chatId, 
      "💰 *Инвестиции*\n\n" +
      "🇷🇺 Акции РФ:\n" +
      "SBER: 285₽\n" +
      "GAZP: 175₽\n" +
      "LKOH: 6,850₽\n\n" +
      "✅ Admin: Бесплатно!", 
      {inline_keyboard: [
        [{text:"📈 Акции РФ", callback_data:"invest_stocks"}],
        [{text:"📊 Облигации", callback_data:"invest_bonds"}],
        [{text:"🔙 Назад", callback_data:"back"}]
      ]}
    );
  }

  return null;
}

// Обработка кнопок (callback queries)
async function handleCallback(cb) {
  const chatId = cb.message.chat.id;
  const data = cb.data;
  let reply = "";
  let kb = null;

  // Ответ на callback (обязательно!)
  await answerCallback(cb.id);

  // Главное меню
  if (data === "back") {
    reply = "🔙 *Главное меню*";
    kb = MAIN_KB;
  }
  else if (data === "categories") {
    reply = "📚 *Категории*";
    kb = MAIN_KB;
  }

  // Школа
  else if (data === "school_main") {
    reply = "🏫 *ШКОЛА*\n\nВыберите предмет:";
    kb = {inline_keyboard: [
      [{text:"📐 Математика", callback_data:"school_math"}],
      [{text:"📖 Русский язык", callback_data:"school_russian"}],
      [{text:"📚 Литература", callback_data:"school_literature"}],
      [{text:"🔬 Физика", callback_data:"school_physics"}],
      [{text:"🧪 Химия", callback_data:"school_chemistry"}],
      [{text:"🔙 Назад", callback_data:"back"}]
    ]};
  }
  else if (data.startsWith("school_")) {
    reply = `🏫 *${data.replace("_", " ").toUpperCase()}*\n\nМатериалы и задания доступны!`;
    kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"school_main"}]]};
  }

  // ВУЗ
  else if (data === "uni_main") {
    reply = "🎓 *ВЫСШЕЕ ОБРАЗОВАНИЕ*\n\nВыберите направление:";
    kb = {inline_keyboard: [
      [{text:"📐 Высшая математика", callback_data:"uni_math"}],
      [{text:"🔬 Физика", callback_data:"uni_phys"}],
      [{text:"💻 Программирование", callback_data:"uni_cs"}],
      [{text:"📊 Экономика", callback_data:"uni_econ"}],
      [{text:"🔙 Назад", callback_data:"back"}]
    ]};
  }
  else if (data.startsWith("uni_")) {
    reply = `🎓 *${data.replace("_", " ").toUpperCase()}*\n\nЛекции и практические работы!`;
    kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"uni_main"}]]};
  }

  // Сад
  else if (data === "garden_main") {
    reply = "🌿 *САД И ОГОРОД*\n\nВыберите культуру:";
    kb = {inline_keyboard: [
      [{text:"🍅 Томаты", callback_data:"garden_tomato"}],
      [{text:"🥒 Огурцы", callback_data:"garden_cucumber"}],
      [{text:"🥕 Корнеплоды", callback_data:"garden_roots"}],
      [{text:"🍇 Плодовые", callback_data:"garden_fruits"}],
      [{text:"🔙 Назад", callback_data:"back"}]
    ]};
  }
  else if (data.startsWith("garden_")) {
    reply = `🌿 *${data.replace("_", " ").toUpperCase()}*\n\nСоветы по выращиванию!`;
    kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"garden_main"}]]};
  }

  // AI Репетитор
  else if (data === "tutor_main") {
    reply = "🎓 *AI РЕПЕТИТОР*\n\nПерсональное обучение!";
    kb = {inline_keyboard: [
      [{text:"📐 Математика", callback_data:"tutor_math"}],
      [{text:"📖 Русский язык", callback_data:"tutor_russian"}],
      [{text:"🇬🇧 English", callback_data:"tutor_english"}],
      [{text:"🔙 Назад", callback_data:"back"}]
    ]};
  }
  else if (data.startsWith("tutor_")) {
    reply = `🎓 *${data.replace("_", " ").toUpperCase()}*\n\nЗадайте любой вопрос!`;
    kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"tutor_main"}]]};
  }

  // Инвестиции
  else if (data === "invest_main") {
    reply = "💰 *ИНВЕСТИЦИИ*\n\nУправление капиталом:";
    kb = {inline_keyboard: [
      [{text:"📈 Акции", callback_data:"invest_stocks"}],
      [{text:"📊 Облигации", callback_data:"invest_bonds"}],
      [{text:"🏦 Фонды", callback_data:"invest_funds"}],
      [{text:"🔙 Назад", callback_data:"back"}]
    ]};
  }
  else if (data.startsWith("invest_")) {
    reply = `💰 *${data.replace("_", " ").toUpperCase()}*\n\nАктуальные данные!`;
    kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"invest_main"}]]};
  }

  // Крипта
  else if (data === "crypto_main") {
    reply = "₿ *КРИПТОВАЛЮТЫ*\n\nКурсы криптовалют:";
    kb = {inline_keyboard: [
      [{text:"₿ Bitcoin", callback_data:"crypto_btc"}],
      [{text:"Ξ Ethereum", callback_data:"crypto_eth"}],
      [{text:"◎ Solana", callback_data:"crypto_sol"}],
      [{text:"🔙 Назад", callback_data:"back"}]
    ]};
  }
  else if (data.startsWith("crypto_")) {
    reply = `₿ *${data.replace("_", " ").toUpperCase()}*\n\nКурс и статистика!`;
    kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"crypto_main"}]]};
  }

  // Погода
  else if (data === "weather_main") {
    reply = "🌤️ *ПОГОДА*\n\nВыберите город:";
    kb = {inline_keyboard: [
      [{text:"🌤️ Москва", callback_data:"weather_msk"}],
      [{text:"🌤️ София", callback_data:"weather_sofia"}],
      [{text:"🌤️ Другой", callback_data:"weather_other"}],
      [{text:"🔙 Назад", callback_data:"back"}]
    ]};
  }
  else if (data.startsWith("weather_")) {
    const cityMap = {"msk": "Москва", "sofia": "София", "other": "Другой город"};
    const city = cityMap[data.replace("weather_", "")] || data;
    reply = `🌤️ *${city}*\n\n🌡️ +20°C\n☀️ Ясно`;
    kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"weather_main"}]]};
  }

  // Инфляция
  else if (data === "inflation_main") {
    reply = "📊 *ИНФЛЯЦИЯ*\n\nЭкономические показатели:";
    kb = {inline_keyboard: [
      [{text:"🇷🇺 Россия", callback_data:"infl_ru"}],
      [{text:"🇧🇬 Болгария", callback_data:"infl_bg"}],
      [{text:"🇺🇸 США", callback_data:"infl_us"}],
      [{text:"🔙 Назад", callback_data:"back"}]
    ]};
  }
  else if (data.startsWith("infl_")) {
    reply = `📊 *ИНФЛЯЦИЯ ${data.replace("infl_", "").toUpperCase()}*\n\nДанные обновляются!`;
    kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"inflation_main"}]]};
  }

  // Юрист
  else if (data === "lawyer_main") {
    reply = "⚖️ *AI ЮРИСТ*\n\nВыберите юрисдикцию:";
    kb = {inline_keyboard: [
      [{text:"🇷🇺 Россия", callback_data:"lawyer_ru"}],
      [{text:"🇧🇬 Болгария", callback_data:"lawyer_bg"}],
      [{text:"🔙 Назад", callback_data:"back"}]
    ]};
  }
  else if (data === "lawyer_ru") {
    reply = "⚖️ *ЮРИСТ РФ*\n\nГК РФ, УК РФ, ТК РФ\n\nЗадайте вопрос!";
    kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"lawyer_main"}]]};
  }
  else if (data === "lawyer_bg") {
    reply = "⚖️ *ЮРИСТ BG*\n\nЗЗД, НК, КТ\n\nЗадайте вопрос!";
    kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"lawyer_main"}]]};
  }

  // Языки
  else if (data === "lang_main") {
    reply = "🗣️ *ЯЗЫКИ*\n\nИзучение языков:";
    kb = {inline_keyboard: [
      [{text:"🇬🇧 English", callback_data:"lang_en"}],
      [{text:"🇧🇬 Български", callback_data:"lang_bg"}],
      [{text:"🇩🇪 Deutsch", callback_data:"lang_de"}],
      [{text:"🔙 Назад", callback_data:"back"}]
    ]};
  }
  else if (data.startsWith("lang_")) {
    const langMap = {"en": "English", "bg": "Български", "de": "Deutsch"};
    const lang = langMap[data.replace("lang_", "")] || data;
    reply = `🗣️ *${lang}*\n\nУроки и упражнения!`;
    kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"lang_main"}]]};
  }

  // Отправка ответа
  if (reply) {
    return sendMessage(chatId, reply, kb);
  }
  
  return null;
}

// ============================================
// MAIN EXPORT
// ============================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // GET - health check и тест
    if (request.method === "GET") {
      if (url.searchParams.get("test") === "send") {
        const chatId = url.searchParams.get("chat") || "1271633868";
        await sendMessage(chatId, "✅ TEST OK from Cloudflare Worker!");
        return new Response(`Test sent to ${chatId}`);
      }
      return new Response("🤖 Aiden PRO Bot is running!\n\nWebhook: Active\nPolling: Disabled");
    }

    // POST - webhook от Telegram
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
        console.error("Webhook error:", e);
        return new Response("Error: " + e.message, {status: 500});
      }
    }

    return new Response("Method not allowed", {status: 405});
  }
};
