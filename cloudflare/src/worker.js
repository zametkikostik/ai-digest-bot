/**
 * AI Digest Bot - GROWTH EDITION
 * Привлечение аудитории + Виральность + Подписчики
 */
const CHANNEL_ID = "-1001859702206";
const INVEST_CHANNEL = "-1001644114424"; // @investora_zametki
const ADMIN_IDS = ["1271633868"];

// Твой личный Telegram (куда приводить людей)
const MY_TELEGRAM = "zametkikostik"; // Твой username

// Быстрые ответы
const QUICK = {
  "invest_Акции": "💰 **АКЦИИ**\n\nАкция — доля в компании.\n\n📈 Плюсы: Рост, Дивиденды\n⚠️ Риски: Волатильность",
  "crypto_Биткоин": "₿ **БИТКОИН**\n\nПервая криптовалюта (2009).\n\n📈 Лимит: 21 млн\n⚠️ Риски: Волатильность",
  "business_Стартап": "📊 **СТАРТАП**\n\nКомпания в поиске модели.\n\n📈 Этапы: Идея → MVP → Масштабирование",
  "inflation_Россия": "📊 **РОССИЯ**\n\n💹 Инфляция: 7.5% 📈",
  "inflation_Болгария": "📊 **БОЛГАРИЯ**\n\n💹 Инфляция: 4.8% ➡️",
  "inflation_США": "📊 **США**\n\n💹 Инфляция: 3.2% 📉"
};

const SCHOOL = ["Математика","Русский язык","Литература","Физика","Химия","Биология","География","История","Обществознание","Информатика","Английский","Немецкий","ОБЖ"];
const UNI = ["Высшая математика","Физика","Химия","Программирование","Базы данных","Сети","Экономика","Менеджмент","Право","Философия","Психология"];
const REFERRAL_REWARD = 50;

const PAID_FEATURES = {
  "tutor": {name: "AI-репетитор", price: 99, duration: "1 месяц", desc: "Персональная помощь"},
  "homework": {name: "Проверка ДЗ", price: 29, duration: "1 проверка", desc: "Разбор ошибок"},
  "exam": {name: "Подготовка к экзамену", price: 149, duration: "2 недели", desc: "ЕГЭ, ОГЭ, сессия"},
  "essay": {name: "Проверка сочинений", price: 49, duration: "1 сочинение", desc: "Разбор + рекомендации"},
  "premium": {name: "PREMIUM", price: 299, duration: "1 месяц", desc: "Все функции безлимитно"}
};

const SPAM_PATTERNS = [/https?:\/\/\S+/i, /@[a-zA-Z0-9_]{5,}/, /(заработ|казино|крипто).{0,30}(денег|прибыль)/i];

export default {
  async fetch(request, env) {
    if (request.method === "GET") return new Response("AI Digest Bot GROWTH");
    
    if (request.method === "POST") {
      const update = await request.json();
      
      // Pre-checkout query
      if (update.pre_checkout_query) {
        await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/answerPreCheckoutQuery`, {
          method: "POST", headers: {"Content-Type": "application/json"},
          body: JSON.stringify({pre_checkout_query_id: update.pre_checkout_query.id, ok: true})
        });
        return new Response("OK");
      }
      
      // Successful payment
      if (update.message?.successful_payment) {
        const userId = update.message.from.id.toString();
        const chatId = update.message.chat.id;
        const feature = update.message.successful_payment.invoice_payload;
        await activatePaidFeature(env, userId, feature);
        await sendMsg(env.BOT_TOKEN, chatId, "✅ **Оплата успешна!**\n\nФункция активирована.\n\n/my_paid — мои покупки");
        return new Response("OK");
      }
      
      // Callback query
      if (update.callback_query) {
        const cb = update.callback_query;
        const data = cb.data;
        const chatId = cb.message.chat.id;
        const msgId = cb.message.message_id;
        const userId = cb.from.id.toString();
        const lang = getLang(userId);
        
        let reply = "";
        let kb = null;
        
        if (QUICK[data]) { reply = QUICK[data]; kb = getBackKB(lang);
        } else if (data === "back_main") { reply = lang==="ru"?"🔙 **Главное меню**":"🔙 **Main Menu**"; kb = getMainKB(lang);
        } else if (data === "school_main") { reply = lang==="ru"?"🏫 **ШКОЛА**":"🏫 **SCHOOL**"; kb = getSchoolKB(lang);
        } else if (data === "uni_main") { reply = lang==="ru"?"🎓 **ВУЗ**":"🎓 **UNIVERSITY**"; kb = getUniKB(lang);
        } else if (data === "tutor_main") {
          const has = await checkTutorAccess(env, userId);
          reply = has ? (lang==="ru"?"🎓 **AI-РЕПЕТИТОР**\n\n✅ Активна подписка!":"🎓 **AI TUTOR**\n\n✅ Subscription active!") : (lang==="ru"?"🎓 **AI-РЕПЕТИТОР**\n\n💰 3 дня бесплатно!":"🎓 **AI TUTOR**\n\n💰 3 days free!");
          kb = getTutorKB(lang);
        } else if (data === "paid_main") { reply = lang==="ru"?"💎 **ПЛАТНЫЕ ФУНКЦИИ**":"💎 **PREMIUM FEATURES**"; kb = getPaidKB(lang);
        } else if (data === "referral_main") {
          const ref = await getReferralData(env, userId);
          const paid = await getPaidReferrals(env, ref.referrals);
          reply = (lang==="ru"
            ? `👥 **РЕФЕРАЛЫ**\n\nПригласили: ${ref.referrals.length}\nКупили: ${paid.length}\n⭐ Заработано: ${ref.earned}\n\nСсылка:\n\`https://t.me/AidenHelpbot?start=ref_${userId}\``
            : `👥 **REFERRALS**\n\nInvited: ${ref.referrals.length}\nPurchased: ${paid.length}\n⭐ Earned: ${ref.earned}\n\nLink:\n\`https://t.me/AidenHelpbot?start=ref_${userId}\``);
          kb = getBackKB(lang);
        } else if (data === "subscribe_main") {
          reply = (lang==="ru"
            ? `📢 **ПОДПИШИСЬ НА КАНАЛЫ!**\n\n` +
              `📌 **@investora_zametki** — Инвестиции и бизнес\n` +
              `📌 **@${MY_TELEGRAM}** — Личный канал автора\n\n` +
              `💡 **Бонус:** Подпишись и получи доступ к премиум контенту!`
            : `📢 **SUBSCRIBE TO CHANNELS!**\n\n` +
              `📌 **@investora_zametki** — Investments & Business\n` +
              `📌 **@${MY_TELEGRAM}** — Author's Channel\n\n` +
              `💡 **Bonus:** Subscribe for premium content!`);
          kb = getSubscribeKB(lang);
        } else if (data === "invest_main") { reply = lang==="ru"?"💰 **ИНВЕСТИЦИИ**":"💰 **INVESTMENTS**"; kb = getInvestKB(lang);
        } else if (data === "crypto_main") { reply = lang==="ru"?"₿ **КРИПТА**":"₿ **CRYPTO**"; kb = getCryptoKB(lang);
        } else if (data === "business_main") { reply = lang==="ru"?"📊 **БИЗНЕС**":"📊 **BUSINESS**"; kb = getBusinessKB(lang);
        } else if (data === "weather_main") { reply = lang==="ru"?"🌤️ **ПОГОДА**":"🌤️ **WEATHER**"; kb = getWeatherKB(lang);
        } else if (data === "inflation_main") { reply = lang==="ru"?"📊 **ИНФЛЯЦИЯ**":"📊 **INFLATION**"; kb = getInflationKB(lang);
        } else if (data.startsWith("school_")) { reply = (lang==="ru"?`🏫 **${data.replace("school_","")}**\n\nНапиши задачу!`:`🏫 **${data.replace("school_","")}**\n\nWrite task!`); kb = getBackKB(lang);
        } else if (data.startsWith("uni_")) { reply = (lang==="ru"?`🎓 **${data.replace("uni_","")}**\n\nНапиши задачу!`:`🎓 **${data.replace("uni_","")}**\n\nWrite task!`); kb = getBackKB(lang);
        } else if (data.startsWith("pay_")) {
          const f = PAID_FEATURES[data.replace("pay_","")];
          if (f) { reply = (lang==="ru"?`💎 **${f.name}**\n\n${f.desc}\n\n💰 **${f.price} звёзд**\n⏱️ ${f.duration}`:`💎 **${f.name}**\n\n${f.desc}\n\n💰 **${f.price} Stars**\n⏱️ ${f.duration}`); kb = getBuyKB(lang, data.replace("pay_","")); }
        } else if (data.startsWith("buy_")) {
          const f = PAID_FEATURES[data.replace("buy_","")];
          if (f) { await sendInvoice(env, chatId, f, lang); return new Response("OK"); }
        } else { reply = "🔙 Menu"; kb = getMainKB(lang); }
        
        if (reply) await sendKB(env, chatId, reply, kb, msgId);
        return new Response("OK");
      }
      
      // Messages
      if (update.message) {
        const msg = update.message;
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const name = msg.from?.first_name || "User";
        const uid = msg.from?.id?.toString();
        const chatType = msg.chat.type;
        const lang = getLang(uid);
        
        // Moderation
        if (chatType === "group" || chatType === "supergroup") {
          const mod = await moderateMessage(env, msg, uid, lang);
          if (mod.action === "delete") {
            await deleteMessage(env.BOT_TOKEN, chatId, msg.message_id);
            if (mod.reason) await sendMsg(env.BOT_TOKEN, chatId, `⚠️ ${name}, ${mod.reason}`);
            return new Response("OK");
          }
          if (!text.startsWith("/") && !text.includes("@AidenHelpbot")) {
            return new Response("OK");
          }
        }
        
        // Referral
        if (text.startsWith("/start ref_")) {
          const refId = text.replace("/start ref_", "");
          if (refId !== uid) {
            await addReferral(env, uid, refId);
            await activateTutor(env, uid, "trial", 3);
            await sendMsg(env.BOT_TOKEN, chatId, lang==="ru"
              ? `✅ Вы по реферальной ссылке!\n\n🎁 3 дня бесплатно!\n\n📢 **Подпишись на каналы:**\n• @investora_zametki\n• @${MY_TELEGRAM}\n\n/tutor — начать`
              : `✅ You joined via referral!\n\n🎁 3 days free!\n\n📢 **Subscribe:**\n• @investora_zametki\n• @${MY_TELEGRAM}\n\n/tutor — start`);
            return new Response("OK");
          }
        }
        
        // Set language
        if (text.startsWith("/lang ")) {
          const newLang = text.replace("/lang ", "").trim();
          if (LANGS[newLang]) {
            await env.RAG_STORE.put(`lang_${uid}`, newLang);
            await sendMsg(env.BOT_TOKEN, chatId, `✅ Language set to ${newLang.toUpperCase()}`);
            return new Response("OK");
          }
        }
        
        // Location (weather)
        if (msg.location) {
          const weather = await getRealWeather(msg.location.latitude, msg.location.longitude);
          await sendMsg(env.BOT_TOKEN, chatId, (lang==="ru"?`🌤️ **ПОГОДА**\n\n📍 ${msg.location.latitude.toFixed(2)}, ${msg.location.longitude.toFixed(2)}\n\n🌡️ ${weather.temp}°C\n${weather.condition}\n💨 ${weather.wind} м/с`:`🌤️ **WEATHER**\n\n📍 ${msg.location.latitude.toFixed(2)}, ${msg.location.longitude.toFixed(2)}\n\n🌡️ ${weather.temp}°C\n${weather.condition}\n💨 ${weather.wind} m/s`));
          return new Response("OK");
        }
        
        let reply = "";
        
        if (text === "/start") {
          const t = LANGS[lang] || LANGS.ru;
          reply = `${t.start}, ${name}!

I am Aiden PRO — universal AI assistant.

🏫 School & University Help
🎓 AI Tutor (3 days free!)
💰 Investments & Crypto
📊 Business Advice
🌤️ Weather
👥 Referrals — Earn 50 Stars!

**Press buttons!**

📢 **Subscribe to channels:**
• @investora_zametki
• @${MY_TELEGRAM}

/lang [en/ru/es/de/fr/it/pt/tr/zh/ja] — set language`;
          await sendKB(env, chatId, reply, getMainKB(lang));
          return new Response("OK");
        }
        
        if (text === "/help") {
          const t = LANGS[lang] || LANGS.ru;
          reply = `${t.help}\n\n/school [subject]\n/university [subject]\n${t.tutor}\n${t.paid}\n${t.ref}\n/subscribe — каналы\n/my_tutor — status\n/my_paid — purchases\n/invest [question]\n/weather [city]\n/lang [en/ru/es...] — language`;
          await sendKB(env, chatId, reply, getHelpKB(lang));
          return new Response("OK");
        }
        
        if (text === "/subscribe") {
          reply = (lang==="ru"
            ? `📢 **ПОДПИШИСЬ НА КАНАЛЫ!**\n\n` +
              `📌 **@investora_zametki** — Инвестиции и бизнес\n` +
              `📌 **@${MY_TELEGRAM}** — Личный канал автора\n\n` +
              `💡 **Бонус:** Подпишись и получи доступ к эксклюзивному контенту!\n\n` +
              `_После подписки нажми /start чтобы продолжить_`
            : `📢 **SUBSCRIBE TO CHANNELS!**\n\n` +
              `📌 **@investora_zametki** — Investments & Business\n` +
              `📌 **@${MY_TELEGRAM}** — Author's Channel\n\n` +
              `💡 **Bonus:** Subscribe for exclusive content!\n\n` +
              `_After subscribe press /start to continue_`);
          await sendKB(env, chatId, reply, getSubscribeKB(lang));
          return new Response("OK");
        }
        
        if (text === "/tutor") {
          const has = await checkTutorAccess(env, uid);
          const t = LANGS[lang] || LANGS.ru;
          reply = has 
            ? (lang==="ru"?"🎓 **AI-РЕПЕТИТОР**\n\n✅ Активна подписка!\n\nНапиши предмет и задачу!":"🎓 **AI TUTOR**\n\n✅ Subscription active!\n\nWrite subject and task!")
            : (lang==="ru"?"🎓 **AI-РЕПЕТИТОР**\n\n⚠️ Нет подписки.\n\n💰 3 дня бесплатно!\n\n/paid — купить":"🎓 **AI TUTOR**\n\n⚠️ No subscription.\n\n💰 3 days free!\n\n/paid — buy");
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        if (text === "/paid") {
          const t = LANGS[lang] || LANGS.ru;
          reply = (lang==="ru"
            ? "💎 **ПЛАТНЫЕ ФУНКЦИИ**\n\n🎓 AI-репетитор — 99⭐/мес\n📝 Проверка ДЗ — 29⭐\n📚 Экзамен — 149⭐\n✍️ Сочинение — 49⭐\n⭐ PREMIUM — 299⭐/мес"
            : "💎 **PREMIUM FEATURES**\n\n🎓 AI Tutor — 99⭐/mo\n📝 Homework check — 29⭐\n📚 Exam prep — 149⭐\n✍️ Essay check — 49⭐\n⭐ PREMIUM — 299⭐/mo");
          await sendKB(env, chatId, reply, getPaidKB(lang));
          return new Response("OK");
        }
        
        if (text === "/my_paid") {
          const paid = await getPaidFeatures(env, uid);
          reply = paid.length === 0 
            ? (lang==="ru"?"💎 **ПОКУПКИ**\n\n❌ Нет покупок":"💎 **PURCHASES**\n\n❌ No purchases")
            : (lang==="ru"?"💎 **ПОКУПКИ**\n\n":"💎 **PURCHASES**\n\n") + paid.map(p => `✅ **${p.feature}**\n📅 ${new Date(p.expires).toLocaleDateString(lang==="ru"?"ru-RU":"en-US")}`).join("\n\n");
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        if (text === "/ref") {
          const ref = await getReferralData(env, uid);
          const paid = await getPaidReferrals(env, ref.referrals);
          reply = (lang==="ru"
            ? `👥 **РЕФЕРАЛЫ**\n\nПригласили: ${ref.referrals.length}\n💰 Купили: ${paid.length}\n⭐ Заработано: ${ref.earned} звёзд\n\n50⭐ за покупку!\n\nСсылка:\n\`https://t.me/AidenHelpbot?start=ref_${uid}\`\n\n📢 **Поделись с друзьями!**`
            : `👥 **REFERRALS**\n\nInvited: ${ref.referrals.length}\n💰 Purchased: ${paid.length}\n⭐ Earned: ${ref.earned} Stars\n\n50⭐ per purchase!\n\nLink:\n\`https://t.me/AidenHelpbot?start=ref_${uid}\`\n\n📢 **Share with friends!**`);
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        if (text === "/my_tutor") {
          reply = (lang==="ru"?"🎓 **СТАТУС**\n\n":"🎓 **STATUS**\n\n") + await getTutorStatus(env, uid, lang);
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        if (text === "/weather" || text.startsWith("/weather ")) {
          const city = text.replace("/weather ", "").trim();
          const weather = await getRealWeatherByCity(city);
          reply = (lang==="ru"?`🌤️ **ПОГОДА: ${city}**\n\n🌡️ ${weather.temp}°C\n${weather.condition}\n💨 ${weather.wind} м/с\n💧 ${weather.humidity}%`:`🌤️ **WEATHER: ${city}**\n\n🌡️ ${weather.temp}°C\n${weather.condition}\n💨 ${weather.wind} m/s\n💧 ${weather.humidity}%`);
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        // AI
        if (text.startsWith("/invest ")) reply = await ai(env, (lang==="ru"?"Инвестиции: ":"Investments: ")+text.replace("/invest ",""));
        else if (text.startsWith("/crypto ")) reply = await ai(env, (lang==="ru"?"Крипта: ":"Crypto: ")+text.replace("/crypto ",""));
        else if (text.startsWith("/business ")) reply = await ai(env, (lang==="ru"?"Бизнес: ":"Business: ")+text.replace("/business ",""));
        else if (text.startsWith("/solve ")) reply = await ai(env, (lang==="ru"?"Реши: ":"Solve: ")+text.replace("/solve ",""));
        else if (text.startsWith("/ask ")) reply = await ai(env, text.replace("/ask ",""));
        else if (text.startsWith("/")) reply = lang==="ru"?"❓ /help":"❓ /help";
        else if (text.includes("@AidenHelpbot")) reply = await ai(env, text.replace("@AidenHelpbot",""));
        else return new Response("OK");
        
        if (reply) await sendMsg(env.BOT_TOKEN, chatId, reply);
      }
      
      return new Response("OK");
    }
    
    return new Response("No");
  },
  
  async scheduled(event, env) {
    const h = new Date().getUTCHours();
    const day = new Date().getUTCDay();
    if (h === 9 && [1,3,5].includes(day)) await sendMsg(env.BOT_TOKEN, INVEST_CHANNEL, `💰 **ИНВЕСТИЦИИ**\n\n${new Date().toLocaleDateString('ru-RU')}\n\n${await ai(env, "Пост про инвестиции. 500 символов. Эмодзи, хэштеги.")}`);
    if (h === 12 && [2,4].includes(day)) await sendMsg(env.BOT_TOKEN, INVEST_CHANNEL, `₿ **КРИПТА**\n\n${new Date().toLocaleDateString('ru-RU')}\n\n${await ai(env, "Пост про криптовалюты. 500 символов. Эмодзи, хэштеги.")}`);
    if (h === 15 && [1,4].includes(day)) await sendMsg(env.BOT_TOKEN, INVEST_CHANNEL, `📊 **БИЗНЕС**\n\n${new Date().toLocaleDateString('ru-RU')}\n\n${await ai(env, "Пост про бизнес. 500 символов. Эмодзи, хэштеги.")}`);
    if (h === 18) await sendMsg(env.BOT_TOKEN, INVEST_CHANNEL, `📰 **ДАЙДЖЕСТ**\n\n${new Date().toLocaleDateString('ru-RU')}\n\n${await ai(env, "Дайджест за день: рынки, крипта, бизнес. Кратко. 500 символов.")}`);
  }
};

// === ЯЗЫКИ ===
const LANGS = {
  "ru": {start:"👋 Привет!", help:"📖 СПРАВКА", tutor:"🎓 AI-репетитор", paid:"💎 Платные", ref:"👥 Рефералы"},
  "en": {start:"👋 Hello!", help:"📖 HELP", tutor:"🎓 AI Tutor", paid:"💎 Premium", ref:"👥 Referrals"},
  "es": {start:"👋 ¡Hola!", help:"📖 AYUDA", tutor:"🎓 Tutor IA", paid:"💎 Premium", ref:"👥 Referidos"},
  "de": {start:"👋 Hallo!", help:"📖 HILFE", tutor:"🎓 KI-Tutor", paid:"💎 Premium", ref:"👥 Empfehlungen"},
  "fr": {start:"👋 Bonjour!", help:"📖 AIDE", tutor:"🎓 Tuteur IA", paid:"💎 Premium", ref:"👥 Parrainages"},
  "it": {start:"👋 Ciao!", help:"📖 AIUTO", tutor:"🎓 Tutor IA", paid:"💎 Premium", ref:"👥 Referral"},
  "pt": {start:"👋 Olá!", help:"📖 AJUDA", tutor:"🎓 Tutor IA", paid:"💎 Premium", ref:"👥 Indicações"},
  "tr": {start:"👋 Merhaba!", help:"📖 YARDIM", tutor:"🎓 AI Eğitmen", paid:"💎 Premium", ref:"👥 Referanslar"},
  "zh": {start:"👋 你好!", help:"📖 帮助", tutor:"🎓 AI 导师", paid:"💎 高级", ref:"👥 推荐"},
  "ja": {start:"👋 こんにちは!", help:"📖 ヘルプ", tutor:"🎓 AI チューター", paid:"💎 プレミアム", ref:"👥 紹介"}
};

function getLang(userId) { return "ru"; }

// === МОДЕРАЦИЯ ===
async function moderateMessage(env, msg, userId, lang) {
  const text = msg.text || msg.caption || "";
  for (const p of SPAM_PATTERNS) { if (p.test(text)) return {action:"delete", reason: lang==="ru"?"спам запрещён":"spam forbidden"}; }
  return {action:"allow"};
}

async function deleteMessage(token, chatId, msgId) {
  await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({chat_id:chatId, message_id:msgId})});
}

// === ОПЛАТА ===
async function sendInvoice(env, chatId, feature, lang) {
  const f = PAID_FEATURES[feature];
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendInvoice`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      chat_id: chatId, title: f.name, description: f.desc, payload: feature,
      currency: "XTR", prices: [{label: f.name, amount: f.price}],
      provider_token: "", start_parameter: "pay_"+feature,
      need_name: false, need_phone_number: false, need_email: false, need_shipping_address: false
    })
  });
}

// === РЕФЕРАЛЫ ===
async function getReferralData(env, userId) {
  try { const d = await env.RAG_STORE.get(`ref_${userId}`); return d ? JSON.parse(d) : {referrer:null, referrals:[], earned:0}; }
  catch(e) { return {referrer:null, referrals:[], earned:0}; }
}

async function addReferral(env, userId, referrerId) {
  try {
    await env.RAG_STORE.put(`ref_${userId}`, JSON.stringify({referrer:referrerId, referrals:[], earned:0}));
    const ref = await getReferralData(env, referrerId);
    if (!ref.referrals.includes(userId)) { ref.referrals.push(userId); await env.RAG_STORE.put(`ref_${referrerId}`, JSON.stringify(ref)); }
  } catch(e) { console.error(e); }
}

async function getPaidReferrals(env, referrals) {
  const paid = []; for (const id of referrals) { if (await checkTutorAccess(env, id)) paid.push(id); }
  return paid;
}

async function payReferralReward(env, userId) {
  try {
    const user = await getReferralData(env, userId);
    if (user.referrer) {
      const ref = await getReferralData(env, user.referrer);
      ref.earned += REFERRAL_REWARD;
      await env.RAG_STORE.put(`ref_${user.referrer}`, JSON.stringify(ref));
    }
  } catch(e) { console.error(e); }
}

// === AI-РЕПЕТИТОР ===
async function checkTutorAccess(env, userId) {
  try { const d = await env.RAG_STORE.get(`tutor_${userId}`); if (!d) return false; const sub = JSON.parse(d); return new Date() < new Date(sub.expires); }
  catch(e) { return false; }
}

async function getTutorStatus(env, userId, lang) {
  try {
    const d = await env.RAG_STORE.get(`tutor_${userId}`);
    if (!d) return lang==="ru"?"❌ Нет подписки\n\n/paid — купить":"❌ No subscription\n\n/paid — buy";
    const sub = JSON.parse(d);
    const days = Math.ceil((new Date(sub.expires) - new Date()) / (1000*60*60*24));
    return `✅ **${sub.plan}**\n\n📅 ${new Date(sub.expires).toLocaleDateString(lang==="ru"?"ru-RU":"en-US")}\n⏳ ${days} days`;
  } catch(e) { return "Error"; }
}

async function activateTutor(env, userId, plan, days) {
  try {
    const expires = new Date(); expires.setDate(expires.getDate() + days);
    await env.RAG_STORE.put(`tutor_${userId}`, JSON.stringify({userId, plan, expires: expires.toISOString()}));
    if (plan !== "trial") await payReferralReward(env, userId);
    return true;
  } catch(e) { return false; }
}

// === ПЛАТНЫЕ ФУНКЦИИ ===
async function getPaidFeatures(env, userId) {
  try { const d = await env.RAG_STORE.get(`paid_${userId}`); return d ? JSON.parse(d) : []; }
  catch(e) { return []; }
}

async function activatePaidFeature(env, userId, feature) {
  try {
    const f = PAID_FEATURES[feature]; if (!f) return false;
    const days = feature==="homework"||feature==="essay" ? 1 : feature==="exam" ? 14 : 30;
    const expires = new Date(); expires.setDate(expires.getDate() + days);
    const paid = await getPaidFeatures(env, userId);
    paid.push({feature: f.name, expires: expires.toISOString()});
    await env.RAG_STORE.put(`paid_${userId}`, JSON.stringify(paid));
    await payReferralReward(env, userId);
    return true;
  } catch(e) { return false; }
}

// === ПОГОДА ===
async function getRealWeather(lat, lon) {
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const d = await r.json();
    return {temp: d.current_weather?.temperature || "N/A", condition: getWeatherCondition(d.current_weather?.weathercode), wind: d.current_weather?.windspeed || "N/A", humidity: "N/A"};
  } catch(e) { return {temp: "N/A", condition: "Error", wind: "N/A", humidity: "N/A"}; }
}

async function getRealWeatherByCity(city) {
  const coords = {"москва":[55.75,37.62],"спб":[59.93,30.33],"казань":[55.79,49.12],"екатеринбург":[56.84,60.61],"новосибирск":[55.00,82.93],"сочи":[43.60,39.73],"минск":[53.90,27.56],"киев":[50.45,30.52],"алматы":[43.25,76.95],"софия":[42.69,23.32],"лондон":[51.50,-0.12],"париж":[48.85,2.35],"берлин":[52.52,13.41],"нью-йорк":[40.71,-74.01]};
  const c = coords[city.toLowerCase()] || [55.75, 37.62];
  return await getRealWeather(c[0], c[1]);
}

function getWeatherCondition(code) { const c = {0:"☀️ Clear",1:"🌤️ Mostly clear",2:"☁️ Cloudy",3:"☁️ Overcast",45:"🌫️ Fog",48:"🌫️ Fog",51:"🌧️ Drizzle",53:"🌧️ Drizzle",55:"🌧️ Drizzle",61:"🌧️ Rain",63:"🌧️ Rain",65:"🌧️ Rain",71:"🌨️ Snow",73:"🌨️ Snow",75:"🌨️ Snow",95:"⛈️ Thunderstorm",96:"⛈️ Thunderstorm",99:"⛈️ Thunderstorm"}; return c[code] || "🌤️ Partly cloudy"; }

// === КЛАВИАТУРЫ ===
function getMainKB(lang) { return {inline_keyboard: [
  [{text:lang==="ru"?"🏫 Школа":"🏫 School",callback_data:"school_main"},{text:lang==="ru"?"🎓 ВУЗ":"🎓 University",callback_data:"uni_main"}],
  [{text:lang==="ru"?"🎓 AI-репетитор":"🎓 AI Tutor",callback_data:"tutor_main"},{text:lang==="ru"?"💎 Платные":"💎 Premium",callback_data:"paid_main"}],
  [{text:lang==="ru"?"👥 Рефералы":"👥 Referrals",callback_data:"referral_main"},{text:lang==="ru"?"📢 Подписаться":"📢 Subscribe",callback_data:"subscribe_main"}],
  [{text:lang==="ru"?"💰 Инвестиции":"💰 Investments",callback_data:"invest_main"},{text:lang==="ru"?"₿ Крипта":"₿ Crypto",callback_data:"crypto_main"}],
  [{text:lang==="ru"?"📊 Бизнес":"📊 Business",callback_data:"business_main"}],
  [{text:lang==="ru"?"🌤️ Погода":"🌤️ Weather",callback_data:"weather_main"},{text:lang==="ru"?"📊 Инфляция":"📊 Inflation",callback_data:"inflation_main"}],
  [{text:lang==="ru"?"📖 Справка":"📖 Help",callback_data:"help_main"}]
]}; }

function getSchoolKB(lang) { const kb=[]; let row=[]; for(let i=0;i<SCHOOL.length;i++){row.push({text:SCHOOL[i],callback_data:"school_"+SCHOOL[i]});if(row.length===2||i===SCHOOL.length-1){kb.push(row);row=[];}} kb.push([{text:lang==="ru"?"🔙 Назад":"🔙 Back",callback_data:"back_main"}]); return {inline_keyboard:kb}; }
function getUniKB(lang) { const kb=[]; let row=[]; for(let i=0;i<UNI.length;i++){row.push({text:UNI[i],callback_data:"uni_"+UNI[i]});if(row.length===2||i===UNI.length-1){kb.push(row);row=[];}} kb.push([{text:lang==="ru"?"🔙 Назад":"🔙 Back",callback_data:"back_main"}]); return {inline_keyboard:kb}; }
function getInvestKB(lang) { return {inline_keyboard: [[{text:lang==="ru"?"Акции":"Stocks",callback_data:"invest_Акции"}],[{text:lang==="ru"?"🔙 Назад":"🔙 Back",callback_data:"back_main"}]]}; }
function getCryptoKB(lang) { return {inline_keyboard: [[{text:lang==="ru"?"Биткоин":"Bitcoin",callback_data:"crypto_Биткоин"}],[{text:lang==="ru"?"🔙 Назад":"🔙 Back",callback_data:"back_main"}]]}; }
function getBusinessKB(lang) { return {inline_keyboard: [[{text:lang==="ru"?"Стартап":"Startup",callback_data:"business_Стартап"}],[{text:lang==="ru"?"🔙 Назад":"🔙 Back",callback_data:"back_main"}]]}; }
function getWeatherKB(lang) { return {inline_keyboard: [[{text:"🇷🇺 Москва",callback_data:"weather_Москва"},{text:"🇷🇺 СПб",callback_data:"weather_СПб"}],[{text:"🇧🇬 София",callback_data:"weather_София"}],[{text:lang==="ru"?"🔙 Назад":"🔙 Back",callback_data:"back_main"}]]}; }
function getInflationKB(lang) { return {inline_keyboard: [[{text:"🇷🇺 Россия",callback_data:"inflation_Россия"},{text:"🇺🇸 США",callback_data:"inflation_США"}],[{text:"🇧🇬 Болгария",callback_data:"inflation_Болгария"}],[{text:lang==="ru"?"🔙 Назад":"🔙 Back",callback_data:"back_main"}]]}; }
function getTutorKB(lang) { return {inline_keyboard: [[{text:lang==="ru"?"💰 Купить":"💰 Buy",callback_data:"pay_tutor"}],[{text:lang==="ru"?"🔙 Назад":"🔙 Back",callback_data:"back_main"}]]}; }
function getPaidKB(lang) { return {inline_keyboard: [[{text:lang==="ru"?"🎓 AI-репетитор — 99⭐":"🎓 AI Tutor — 99⭐",callback_data:"pay_tutor"}],[{text:lang==="ru"?"📝 ДЗ — 29⭐":"📝 Homework — 29⭐",callback_data:"pay_homework"}],[{text:lang==="ru"?"📚 Экзамен — 149⭐":"📚 Exam — 149⭐",callback_data:"pay_exam"}],[{text:lang==="ru"?"✍️ Сочинение — 49⭐":"✍️ Essay — 49⭐",callback_data:"pay_essay"}],[{text:lang==="ru"?"⭐ PREMIUM — 299⭐":"⭐ PREMIUM — 299⭐",callback_data:"pay_premium"}],[{text:lang==="ru"?"🔙 Назад":"🔙 Back",callback_data:"back_main"}]]}; }
function getBuyKB(lang, feature) { return {inline_keyboard: [[{text:lang==="ru"?"💳 Купить":"💳 Buy",callback_data:"buy_"+feature}],[{text:lang==="ru"?"🔙 Назад":"🔙 Back",callback_data:"paid_main"}]]}; }
function getSubscribeKB(lang) { return {inline_keyboard: [
  [{text:"📌 @investora_zametki",url:"https://t.me/investora_zametki"}],
  [{text:`📌 @${MY_TELEGRAM}`,url:`https://t.me/${MY_TELEGRAM}`}],
  [{text:lang==="ru"?"🔙 Назад":"🔙 Back",callback_data:"back_main"}]
]}; }
function getBackKB(lang) { return {inline_keyboard: [[{text:lang==="ru"?"🔙 В меню":"🔙 Menu",callback_data:"back_main"}]]}; }
function getHelpKB(lang) { return {inline_keyboard: [[{text:lang==="ru"?"🔙 Меню":"🔙 Menu",callback_data:"back_main"}]]}; }

async function sendKB(env, chatId, text, kb, msgId = null) {
  try { await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({chat_id:chatId, text:text, parse_mode:"Markdown", reply_markup:JSON.stringify(kb), reply_to_message_id:msgId})}); }
  catch(e) { console.error(e); }
}

function sendMsg(token, chatId, text) {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({chat_id:chatId, text:text, parse_mode:"Markdown"})}).then(r => r.json());
}

async function ai(env, text) {
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {method:"POST", headers:{"Authorization":"Bearer "+env.OPENROUTER_API_KEY, "Content-Type":"application/json"}, body:JSON.stringify({model:"mistralai/mistral-7b-instruct:free", messages:[{role:"user",content:text}], max_tokens:800})});
    const d = await r.json(); return d.choices?.[0]?.message?.content || "N/A";
  } catch(e) { return "Error: "+e.message; }
}
