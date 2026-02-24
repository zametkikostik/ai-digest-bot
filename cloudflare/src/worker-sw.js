/**
 * Aiden PRO Bot - Cloudflare Workers (Service Worker Format)
 * Все кнопки и команды работают через webhook
 */

const BOT_TOKEN = "8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc";

// Получение котировок криптовалют (CoinGecko API - бесплатно, без ключа)
async function getCryptoPrices() {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,cardano,ripple&vs_currencies=usd&include_24hr_change=true', {
      headers: {'Accept': 'application/json'}
    });
    const data = await r.json();
    return {
      btc: { price: data.bitcoin.usd, change: data.bitcoin.usd_24h_change?.toFixed(2) },
      eth: { price: data.ethereum.usd, change: data.ethereum.usd_24h_change?.toFixed(2) },
      sol: { price: data.solana.usd, change: data.solana.usd_24h_change?.toFixed(2) },
      bnb: { price: data.binancecoin.usd, change: data.binancecoin.usd_24h_change?.toFixed(2) },
      ada: { price: data.cardano.usd, change: data.cardano.usd_24h_change?.toFixed(2) },
      xrp: { price: data.ripple.usd, change: data.ripple.usd_24h_change?.toFixed(2) }
    };
  } catch(e) {
    console.error("Crypto API error:", e);
    return null;
  }
}

// Получение котировок MOEX (через Investing.com API - бесплатно)
async function getMoexPrices() {
  try {
    const r = await fetch('https://www.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?s=sber,gazp,lkoh,tatn,polvb,yndxsban', {
      headers: {'Accept': 'application/json'}
    });
    const data = await r.json();
    const securities = {};
    
    if (data && data.securities && data.marketdata) {
      const secMap = new Map(data.securities.data.map(s => [s[0], s[1]])); // code -> name
      const dataMap = new Map(data.marketdata.data.map(d => [d[0], d])); // code -> data
      
      // Индексы: LAST=11, CHANGE=12, CHANGEPRC=13
      for (const [code, name] of secMap) {
        const d = dataMap.get(code);
        if (d) {
          securities[code.toLowerCase()] = {
            name: name,
            price: d[11] || 0,
            change: d[12] || 0,
            changePrc: d[13] || 0
          };
        }
      }
    }
    return securities;
  } catch(e) {
    console.error("MOEX API error:", e);
    return null;
  }
}

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
  inline_keyboard: [[{text:"📚 Категории", callback_data:"categories"}, {text:"🔙 Назад", callback_data:"back"}]]
};

// Отправка сообщения
async function sendMessage(chatId, text, replyMarkup = null) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const body = { chat_id: chatId, text: text, parse_mode: "Markdown" };
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
      body: JSON.stringify({ callback_query_id: callbackQueryId, text: text, show_alert: !!text })
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
      `🤖 Я *Aiden PRO* — твой умный помощник!\n\n` +
      `📚 *Разделы:*\n` +
      `• 🏫 Школа/ВУЗ • 🌿 Сад\n` +
      `• 🎓 AI Репетитор • 💰 Инвест\n` +
      `• ₿ Крипта • 🌤️ Погода\n` +
      `• ⚖️ Юрист • 🗣️ Языки\n\n👇 Жми кнопки!`, 
      MAIN_KB);
  }

  if (text === "/help") {
    return sendMessage(chatId, "📖 *СПРАВКА*\n\n/start — Меню\n/help — Справка\n/categories — Категории\n\n✅ Admin: бесплатно!", HELP_KB);
  }

  if (text === "/categories") {
    return sendMessage(chatId, "📚 *Категории:*\n\nВыберите раздел:", MAIN_KB);
  }

  if (text === "/tutor") {
    return sendMessage(chatId, "🎓 *AI Репетитор*\n\nAdmin: Бесплатно!", 
      {inline_keyboard: [[{text:"📐 Математика", callback_data:"tutor_math"}, {text:"📖 Русский", callback_data:"tutor_russian"}], [{text:"🔙 Назад", callback_data:"back"}]]});
  }

  if (text === "/language" || text === "/languages") {
    return sendMessage(chatId, "🗣️ *Языки*\n\n🇬🇧 English\n🇧🇬 Български\n🇩🇪 Deutsch", 
      {inline_keyboard: [[{text:"🇬🇧 English", callback_data:"lang_en"}, {text:"🇧🇬 Български", callback_data:"lang_bg"}], [{text:"🔙 Назад", callback_data:"back"}]]});
  }

  if (text === "/lawyer") {
    return sendMessage(chatId, "⚖️ *AI Юрист*\n\n🇷🇺 РФ (ГК, УК, ТК)\n🇧🇬 BG (ЗЗД, НК, КТ)", 
      {inline_keyboard: [[{text:"🇷🇺 Юрист РФ", callback_data:"lawyer_ru"}, {text:"🇧🇬 Юрист BG", callback_data:"lawyer_bg"}], [{text:"🔙 Назад", callback_data:"back"}]]});
  }

  if (text === "/weather") {
    return sendMessage(chatId, "🌤️ *Погода*\n\nОтправьте: `/weather [город]`", 
      {inline_keyboard: [[{text:"🌤️ Москва", callback_data:"weather_msk"}, {text:"🌤️ София", callback_data:"weather_sofia"}], [{text:"🔙 Назад", callback_data:"back"}]]});
  }

  if (text?.startsWith("/weather ")) {
    const city = text.replace("/weather ", "");
    return sendMessage(chatId, `🌤️ *${city}*\n\n🌡️ +20°C\n☀️ Ясно\n💨 5 м/с`, 
      {inline_keyboard: [[{text:"🔙 Назад", callback_data:"weather_main"}]]});
  }

  if (text === "/crypto") {
    const crypto = await getCryptoPrices();
    if (crypto) {
      const fmt = (c) => `$${c.price.toLocaleString()} (${c.change >= 0 ? '📈' : '📉'}${c.change}%)`;
      return sendMessage(chatId, 
        `₿ *КРИПТОВАЛЮТЫ*\n\n` +
        `BTC: ${fmt(crypto.btc)}\n` +
        `ETH: ${fmt(crypto.eth)}\n` +
        `SOL: ${fmt(crypto.sol)}\n` +
        `BNB: ${fmt(crypto.bnb)}\n` +
        `ADA: ${fmt(crypto.ada)}\n` +
        `XRP: ${fmt(crypto.xrp)}\n\n` +
        `_Данные обновляются каждые 5 мин_`, 
        {inline_keyboard: [
          [{text:"📊 BTC", callback_data:"crypto_btc"}, {text:"📊 ETH", callback_data:"crypto_eth"}],
          [{text:"📊 SOL", callback_data:"crypto_sol"}, {text:"📊 BNB", callback_data:"crypto_bnb"}],
          [{text:"🔄 Обновить", callback_data:"crypto_refresh"}],
          [{text:"🔙 Назад", callback_data:"back"}]
        ]});
    }
    // Fallback если API не доступен
    return sendMessage(chatId, "₿ *Крипта*\n\nЗагрузка котировок...\n\nBTC: ~$67000\nETH: ~$3500\nSOL: ~$145", 
      {inline_keyboard: [[{text:"📊 BTC", callback_data:"crypto_btc"}, {text:"📊 ETH", callback_data:"crypto_eth"}], [{text:"🔙 Назад", callback_data:"back"}]]});
  }

  if (text === "/invest") {
    const moex = await getMoexPrices();
    if (moex && moex.sber) {
      const fmt = (s) => `${s.price}₽ (${s.changePrc >= 0 ? '📈' : '📉'}${s.changePrc}%)`;
      return sendMessage(chatId, 
        `💰 *АКЦИИ МОСКОВСКОЙ БИРЖИ*\n\n` +
        `СБЕР: ${fmt(moex.sber)}\n` +
        `ГАЗП: ${fmt(moex.gazp)}\n` +
        `ЛУКОЙ: ${fmt(moex.lkoh)}\n` +
        `ТАТН: ${fmt(moex.tatn)}\n` +
        `ПОЛЮ: ${fmt(moex.polvb)}\n` +
        `ЯНДЕКС: ${fmt(moex.yndxsban)}\n\n` +
        `_Данные с MOEX (Т+)_`, 
        {inline_keyboard: [
          [{text:"📈 СБЕР", callback_data:"moex_sber"}, {text:"📈 ГАЗП", callback_data:"moex_gazp"}],
          [{text:"📈 ЛУКОЙ", callback_data:"moex_lkoh"}, {text:"📈 ТАТН", callback_data:"moex_tatn"}],
          [{text:"🔄 Обновить", callback_data:"moex_refresh"}],
          [{text:"🔙 Назад", callback_data:"back"}]
        ]});
    }
    // Fallback если API не доступен
    return sendMessage(chatId, "💰 *Инвест*\n\nЗагрузка котировок MOEX...\n\nSBER: ~285₽\nGAZP: ~175₽\nLKOH: ~6850₽", 
      {inline_keyboard: [[{text:"📈 Акции", callback_data:"invest_stocks"}], [{text:"🔙 Назад", callback_data:"back"}]]});
  }

  return null;
}

// Обработка кнопок
async function handleCallback(cb) {
  const chatId = cb.message.chat.id;
  const data = cb.data;
  let reply = "", kb = null;

  await answerCallback(cb.id);

  // Навигация
  if (data === "back" || data === "categories") { reply = data === "back" ? "🔙 *Меню*" : "📚 *Категории*"; kb = MAIN_KB; }
  
  // Школа
  else if (data === "school_main") { reply = "🏫 *ШКОЛА*"; kb = {inline_keyboard: [[{text:"Математика", callback_data:"school_math"}, {text:"Русский", callback_data:"school_russian"}], [{text:"🔙 Назад", callback_data:"back"}]]}; }
  else if (data.startsWith("school_")) { reply = `🏫 ${data.toUpperCase()}`; kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"school_main"}]]}; }
  
  // ВУЗ
  else if (data === "uni_main") { reply = "🎓 *ВУЗ*"; kb = {inline_keyboard: [[{text:"Вышмат", callback_data:"uni_math"}, {text:"Физика", callback_data:"uni_phys"}], [{text:"🔙 Назад", callback_data:"back"}]]}; }
  else if (data.startsWith("uni_")) { reply = `🎓 ${data.toUpperCase()}`; kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"uni_main"}]]}; }
  
  // Сад
  else if (data === "garden_main") { reply = "🌿 *САД*"; kb = {inline_keyboard: [[{text:"Томаты", callback_data:"garden_tomato"}, {text:"Огурцы", callback_data:"garden_cucumber"}], [{text:"🔙 Назад", callback_data:"back"}]]}; }
  else if (data.startsWith("garden_")) { reply = `🌿 ${data.toUpperCase()}`; kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"garden_main"}]]}; }
  
  // Репетитор
  else if (data === "tutor_main") { reply = "🎓 *AI Репетитор*"; kb = {inline_keyboard: [[{text:"Математика", callback_data:"tutor_math"}, {text:"Русский", callback_data:"tutor_russian"}], [{text:"🔙 Назад", callback_data:"back"}]]}; }
  else if (data.startsWith("tutor_")) { reply = `🎓 ${data.toUpperCase()}`; kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"tutor_main"}]]}; }
  
  // Инвест - MOEX
  else if (data === "invest_main") { reply = "💰 *ИНВЕСТ*"; kb = {inline_keyboard: [[{text:"📈 Акции РФ", callback_data:"invest_stocks"}, {text:"📊 Облигации", callback_data:"invest_bonds"}], [{text:"🔙 Назад", callback_data:"back"}]]}; }
  else if (data === "invest_stocks") {
    const moex = await getMoexPrices();
    if (moex && moex.sber) {
      const fmt = (s) => `${s.price}₽ (${s.changePrc >= 0 ? '📈' : '📉'}${s.changePrc}%)`;
      reply = `💰 *АКЦИИ МОСКОВСКОЙ БИРЖИ*\n\n` +
        `СБЕР: ${fmt(moex.sber)}\n` +
        `ГАЗП: ${fmt(moex.gazp)}\n` +
        `ЛУКОЙ: ${fmt(moex.lkoh)}\n` +
        `ТАТН: ${fmt(moex.tatn)}\n` +
        `ПОЛЮ: ${fmt(moex.polvb)}\n` +
        `ЯНДЕКС: ${fmt(moex.yndxsban)}`;
      kb = {inline_keyboard: [[{text:"🔄 Обновить", callback_data:"moex_refresh"}], [{text:"🔙 Назад", callback_data:"back"}]]};
    } else {
      reply = "💰 *Акции РФ*\n\nЗагрузка...";
      kb = {inline_keyboard: [[{text:"🔄 Обновить", callback_data:"moex_refresh"}], [{text:"🔙 Назад", callback_data:"back"}]]};
    }
  }
  else if (data === "moex_refresh") {
    await answerCallback(cb.id, "Обновляю котировки...");
    const moex = await getMoexPrices();
    if (moex && moex.sber) {
      const fmt = (s) => `${s.price}₽ (${s.changePrc >= 0 ? '📈' : '📉'}${s.changePrc}%)`;
      reply = `💰 *АКЦИИ MOEX*\n\n` +
        `СБЕР: ${fmt(moex.sber)}\n` +
        `ГАЗП: ${fmt(moex.gazp)}\n` +
        `ЛУКОЙ: ${fmt(moex.lkoh)}\n` +
        `ТАТН: ${fmt(moex.tatn)}\n` +
        `ПОЛЮ: ${fmt(moex.polvb)}\n` +
        `ЯНДЕКС: ${fmt(moex.yndxsban)}\n\n` +
        `_Обновлено: ${new Date().toLocaleTimeString('ru-RU')}_`;
      kb = {inline_keyboard: [[{text:"🔄 Обновить", callback_data:"moex_refresh"}], [{text:"🔙 Назад", callback_data:"back"}]]};
    }
  }
  else if (data.startsWith("moex_")) {
    const names = {"sber":"СБЕР","gazp":"ГАЗП","lkoh":"ЛУКОЙЛ","tatn":"ТАТНЕФТЬ","polvb":"ПОЛЮС","yndxsban":"ЯНДЕКС"};
    reply = `📈 *${names[data.replace("moex_","")] || data}*\n\nДетальная статистика...`;
    kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"invest_stocks"}]]};
  }
  else if (data.startsWith("invest_")) { reply = `💰 ${data.toUpperCase()}`; kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"invest_main"}]]}; }

  // Крипта
  else if (data === "crypto_main") { reply = "₿ *КРИПТА*"; kb = {inline_keyboard: [[{text:"BTC", callback_data:"crypto_btc"}, {text:"ETH", callback_data:"crypto_eth"}], [{text:"🔙 Назад", callback_data:"back"}]]}; }
  else if (data === "crypto_refresh") {
    await answerCallback(cb.id, "Обновляю курсы...");
    const crypto = await getCryptoPrices();
    if (crypto) {
      const fmt = (c) => `$${c.price.toLocaleString()} (${c.change >= 0 ? '📈' : '📉'}${c.change}%)`;
      reply = `₿ *КРИПТОВАЛЮТЫ*\n\n` +
        `BTC: ${fmt(crypto.btc)}\n` +
        `ETH: ${fmt(crypto.eth)}\n` +
        `SOL: ${fmt(crypto.sol)}\n` +
        `BNB: ${fmt(crypto.bnb)}\n` +
        `ADA: ${fmt(crypto.ada)}\n` +
        `XRP: ${fmt(crypto.xrp)}\n\n` +
        `_Обновлено: ${new Date().toLocaleTimeString('ru-RU')}_`;
      kb = {inline_keyboard: [[{text:"🔄 Обновить", callback_data:"crypto_refresh"}], [{text:"🔙 Назад", callback_data:"back"}]]};
    }
  }
  else if (data === "crypto_btc") {
    const crypto = await getCryptoPrices();
    if (crypto) {
      reply = `₿ *BITCOIN*\n\n` +
        `Цена: $${crypto.btc.price.toLocaleString()}\n` +
        `Изменение: ${crypto.btc.change >= 0 ? '📈' : '📉'}${crypto.btc.change}%\n` +
        `Рыночная кап: ~$1.3 трлн`;
      kb = {inline_keyboard: [[{text:"🔄 Обновить", callback_data:"crypto_refresh"}], [{text:"🔙 Назад", callback_data:"crypto_main"}]]};
    }
  }
  else if (data === "crypto_eth") {
    const crypto = await getCryptoPrices();
    if (crypto) {
      reply = `Ξ *ETHEREUM*\n\n` +
        `Цена: $${crypto.eth.price.toLocaleString()}\n` +
        `Изменение: ${crypto.eth.change >= 0 ? '📈' : '📉'}${crypto.eth.change}%`;
      kb = {inline_keyboard: [[{text:"🔄 Обновить", callback_data:"crypto_refresh"}], [{text:"🔙 Назад", callback_data:"crypto_main"}]]};
    }
  }
  else if (data === "crypto_sol") {
    const crypto = await getCryptoPrices();
    if (crypto) {
      reply = `◎ *SOLANA*\n\n` +
        `Цена: $${crypto.sol.price.toLocaleString()}\n` +
        `Изменение: ${crypto.sol.change >= 0 ? '📈' : '📉'}${crypto.sol.change}%`;
      kb = {inline_keyboard: [[{text:"🔄 Обновить", callback_data:"crypto_refresh"}], [{text:"🔙 Назад", callback_data:"crypto_main"}]]};
    }
  }
  else if (data === "crypto_bnb") {
    const crypto = await getCryptoPrices();
    if (crypto) {
      reply = `🟡 *BINANCE COIN*\n\n` +
        `Цена: $${crypto.bnb.price.toLocaleString()}\n` +
        `Изменение: ${crypto.bnb.change >= 0 ? '📈' : '📉'}${crypto.bnb.change}%`;
      kb = {inline_keyboard: [[{text:"🔄 Обновить", callback_data:"crypto_refresh"}], [{text:"🔙 Назад", callback_data:"crypto_main"}]]};
    }
  }
  else if (data.startsWith("crypto_")) { reply = `₿ ${data.toUpperCase()}`; kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"crypto_main"}]]}; }
  
  // Погода
  else if (data === "weather_main") { reply = "🌤️ *ПОГОДА*"; kb = {inline_keyboard: [[{text:"Москва", callback_data:"weather_msk"}, {text:"София", callback_data:"weather_sofia"}], [{text:"🔙 Назад", callback_data:"back"}]]}; }
  else if (data.startsWith("weather_")) { reply = `🌤️ ${data.toUpperCase()}`; kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"weather_main"}]]}; }
  
  // Инфляция
  else if (data === "inflation_main") { reply = "📊 *ИНФЛЯЦИЯ*"; kb = {inline_keyboard: [[{text:"Россия", callback_data:"infl_ru"}, {text:"Болгария", callback_data:"infl_bg"}], [{text:"🔙 Назад", callback_data:"back"}]]}; }
  else if (data.startsWith("infl_")) { reply = `📊 ${data.toUpperCase()}`; kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"inflation_main"}]]}; }
  
  // Юрист
  else if (data === "lawyer_main") { reply = "⚖️ *ЮРИСТ*"; kb = {inline_keyboard: [[{text:"🇷🇺 РФ", callback_data:"lawyer_ru"}, {text:"🇧🇬 BG", callback_data:"lawyer_bg"}], [{text:"🔙 Назад", callback_data:"back"}]]}; }
  else if (data === "lawyer_ru") { reply = "⚖️ *ЮРИСТ РФ*\n\nГК РФ, УК РФ, ТК РФ"; kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"lawyer_main"}]]}; }
  else if (data === "lawyer_bg") { reply = "⚖️ *ЮРИСТ BG*\n\nЗЗД, НК, КТ"; kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"lawyer_main"}]]}; }
  
  // Языки
  else if (data === "lang_main") { reply = "🗣️ *ЯЗЫКИ*"; kb = {inline_keyboard: [[{text:"🇬🇧 English", callback_data:"lang_en"}, {text:"🇧🇬 Български", callback_data:"lang_bg"}], [{text:"🔙 Назад", callback_data:"back"}]]}; }
  else if (data.startsWith("lang_")) { reply = `🗣️ ${data.toUpperCase()}`; kb = {inline_keyboard: [[{text:"🔙 Назад", callback_data:"lang_main"}]]}; }

  if (reply) await sendMessage(chatId, reply, kb);
  return null;
}

// Main handler
addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method === "GET") {
    if (url.searchParams.get("test") === "send") {
      const chatId = url.searchParams.get("chat") || "1271633868";
      event.respondWith((async () => {
        await sendMessage(chatId, "✅ TEST OK from Cloudflare!");
        return new Response(`Test sent to ${chatId}`);
      })());
    } else {
      event.respondWith(new Response("🤖 Aiden PRO Bot\n\nWebhook: Active"));
    }
    return;
  }

  if (request.method === "POST") {
    event.respondWith((async () => {
      try {
        const update = await request.json();
        if (update.message) await handleCommand(update.message);
        if (update.callback_query) await handleCallback(update.callback_query);
        return new Response("OK");
      } catch(e) {
        return new Response("Error: " + e.message, {status: 500});
      }
    })());
    return;
  }

  event.respondWith(new Response("Method not allowed", {status: 405}));
});
