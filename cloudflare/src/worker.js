/**
 * AI Digest Bot - RAG + SCHEDULER
 * Cloudflare Workers: AI, D1, KV, Cron
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
  "inflation_США": "📊 США\n\n💹 Инфляция: 3.2%",
  
  // САД И ОГОРОД
  "garden_Томаты": "🍅 ТОМАТЫ\n\n🌱 Посев: март-апрель\n🌿 Высадка: май-июнь\n💧 Полив: 2-3 раза/неделю\n☀️ Свет: 6-8 часов\n\n📸 https://images.unsplash.com/photo-1592878904946-b3cd8ae243d9?w=400",
  "garden_Огурцы": "🥒 ОГУРЦЫ\n\n🌱 Посев: апрель-май\n🌿 Высадка: май-июнь\n💧 Полив: ежедневно\n☀️ Свет: 4-6 часов\n\n📸 https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400",
  "garden_Перец": "🫑 ПЕРЕЦ\n\n🌱 Посев: март\n🌿 Высадка: май-июнь\n💧 Полив: 2-3 раза/неделю\n☀️ Свет: 8-10 часов\n\n📸 https://images.unsplash.com/photo-1563514227147-6d2434393843?w=400",
  "garden_Морковь": "🥕 МОРКОВЬ\n\n🌱 Посев: апрель-май\n🌿 Прореживание: 2 раза\n💧 Полив: умеренный\n☀️ Свет: 6-8 часов\n\n📸 https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400",
  "garden_Картофель": "🥔 КАРТОФЕЛЬ\n\n🌱 Посадка: апрель-май\n🌿 Окучивание: 2-3 раза\n💧 Полив: в засуху\n☀️ Свет: 6-8 часов\n\n📸 https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400",
  "garden_Капуста": "🥬 КАПУСТА\n\n🌱 Посев: март-апрель\n🌿 Высадка: май\n💧 Полив: обильный\n☀️ Свет: 6-8 часов\n\n📸 https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400",
  "garden_Лук": "🧅 ЛУК\n\n🌱 Посадка: апрель-май\n🌿 Уход: минимальный\n💧 Полив: умеренный\n☀️ Свет: 6-8 часов\n\n📸 https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400",
  "garden_Чеснок": "🧄 ЧЕСНОК\n\n🌱 Посадка: сентябрь-октябрь\n🌿 Уход: минимальный\n💧 Полив: умеренный\n☀️ Свет: 6-8 часов\n\n📸 https://images.unsplash.com/photo-1615477066914-673c0a1cd8f9?w=400",
  "garden_Клубника": "🍓 КЛУБНИКА\n\n🌱 Посадка: июль-август\n🌿 Уход: обрезка усов\n💧 Полив: 2-3 раза/неделю\n☀️ Свет: 8-10 часов\n\n📸 https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400",
  "garden_Яблоня": "🍎 ЯБЛОНЯ\n\n🌱 Посадка: апрель-октябрь\n🌿 Обрезка: весна/осень\n💧 Полив: 3-4 раза/сезон\n☀️ Свет: 8-10 часов\n\n📸 https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400",
  "garden_Смородина": "🫐 СМОРОДИНА\n\n🌱 Посадка: сентябрь-октябрь\n🌿 Обрезка: осень\n💧 Полив: в засуху\n☀️ Свет: 6-8 часов\n\n📸 https://images.unsplash.com/photo-1596435036898-4038c0549c43?w=400",
  "garden_Малина": "🍇 МАЛИНА\n\n🌱 Посадка: октябрь\n🌿 Обрезка: после сбора\n💧 Полив: обильный\n☀️ Свет: 6-8 часов\n\n📸 https://images.unsplash.com/photo-1596568358807-7e6df7f6e9a5?w=400",
  "garden_Цветы": "🌸 ЦВЕТЫ\n\n🌱 Посев: март-апрель\n🌿 Уход: по виду\n💧 Полив: по потребности\n☀️ Свет: по виду\n\n📸 https://images.unsplash.com/photo-1490750967868-bcdf92dd213b?w=400",
  "garden_Газон": "🌿 ГАЗОН\n\n🌱 Посев: апрель-сентябрь\n🌿 Стрижка: раз в неделю\n💧 Полив: 2-3 раза/неделю\n☀️ Свет: 6-8 часов\n\n📸 https://images.unsplash.com/photo-1558905540-2129070a28fc?w=400",
  "garden_Удобрения": "🧪 УДОБРЕНИЯ\n\n🌱 Азот: рост листьев\n🌱 Фосфор: корни\n🌱 Калий: иммунитет\n🌱 Органика: перегной, компост\n\n📸 https://images.unsplash.com/photo-1628102491629-778571d893a3?w=400",
  "garden_Вредители": "🐛 ВРЕДИТЕЛИ\n\n🚫 Тля: мыльный раствор\n🚫 Колорадский: сбор вручную\n🚫 Медведка: ловушки\n🚫 Слизни: зола, известь\n\n📸 https://images.unsplash.com/photo-1596700095722-2c8e2c6d8d71?w=400",
  "garden_Болезни": "🦠 БОЛЕЗНИ\n\n⚠️ Фитофтора: медьсодержащие\n⚠️ Мучнистая роса: сода\n⚠️ Ржавчина: бордосская жидкость\n⚠️ Профилактика: севооборот\n\n📸 https://images.unsplash.com/photo-1585314062604-1a357de8b000?w=400",
  "garden_Календарь": "📅 КАЛЕНДАРЬ\n\n🌱 Март: рассада\n🌱 Апрель: посев в грунт\n🌱 Май: высадка\n🌱 Июнь: уход\n🌱 Июль: сбор\n🌱 Август: заготовки\n🌱 Сентябрь: уборка\n🌱 Октябрь: подготовка к зиме\n\n📸 https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=400"
};

const SCHOOL = ["Математика","Русский язык","Литература","Физика","Химия","Биология","География","История","Обществознание","Информатика","Английский","Немецкий","ОБЖ"];
const UNI = ["Высшая математика","Физика","Химия","Программирование","Базы данных","Сети","Экономика","Менеджмент","Право","Философия","Психология"];
const GARDEN = ["🍅 Томаты","🥒 Огурцы","🫑 Перец","🥕 Морковь","🥔 Картофель","🥬 Капуста","🧅 Лук","🧄 Чеснок","🍓 Клубника","🍎 Яблоня","🫐 Смородина","🍇 Малина","🌸 Цветы","🌿 Газон","🧪 Удобрения","🐛 Вредители","🦠 Болезни","📅 Календарь"];
const REFERRAL_REWARD = 50;

const PAID_FEATURES = {
  "tutor": {name: "AI-репетитор", price: 99, duration: "1 месяц"},
  "homework": {name: "Проверка ДЗ", price: 29, duration: "1 проверка"},
  "exam": {name: "Экзамен", price: 149, duration: "2 недели"},
  "essay": {name: "Сочинение", price: 49, duration: "1 шт"},
  "premium": {name: "PREMIUM", price: 299, duration: "1 месяц"}
};

// POST TEMPLATES FOR SCHEDULER
const POST_TEMPLATES = {
  morning: [
    "🌅 ДОБРОЕ УТРО! Начни день с пользы:\n\n{content}\n\n💡 Примени этот совет сегодня!",
    "☕ Утренний инсайт:\n\n{content}\n\n🚀 Вперёд к новым достижениям!",
    "🌞 Доброе утро! Сегодняшний фокус:\n\n{content}\n\n📌 Запомни это!"
  ],
  afternoon: [
    "📊 ДНЕВНОЙ ДАЙДЖЕСТ\n\n{content}\n\n💼 Используй на практике!",
    "⚡ Актуально днём:\n\n{content}\n\n🎯 Будь в тренде!",
    "🔥 Горячая тема:\n\n{content}\n\n📈 Применяй сейчас!"
  ],
  evening: [
    "🌙 ВЕЧЕРНИЙ РАЗБОР\n\n{content}\n\n📚 Изучи перед сном!",
    "📖 На ночь глядя:\n\n{content}\n\n💭 Обдумай завтра!",
    "🏆 Итоги дня:\n\n{content}\n\n✨ До завтра!"
  ]
};

const POST_TOPICS = [
  "Нейросети для работы",
  "AI инструменты 2026",
  "Промпт-инжиниринг",
  "Автоматизация бизнеса",
  "Машинное обучение",
  "ChatGPT секреты",
  "AI для студентов",
  "Будущее профессий"
];

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

        // Быстрая реакция на нажатие (answerCallbackQuery)
        await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({callback_query_id: cb.id})
        });

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
        else if (data === "garden_main") { reply = "🌿 САД И ОГОРОД\n\nВыбери культуру:"; kb = gardenKB(); }
        else if (data.startsWith("school_")) { reply = `🏫 ${data.replace("school_","")}\n\nНапиши задачу — решу!`; kb = backKB(); }
        else if (data.startsWith("uni_")) { reply = `🎓 ${data.replace("uni_","")}\n\nНапиши задачу — помогу!`; kb = backKB(); }
        else if (data.startsWith("garden_")) {
          const plant = data.replace("garden_","");
          const fullReply = QUICK[data];
          if (fullReply) {
            // Извлекаем URL картинки
            const photoMatch = fullReply.match(/\📸 (https?:\/\/\S+)/);
            const photoUrl = photoMatch ? photoMatch[1] : null;
            const caption = fullReply.replace(/\📸 https?:\/\/\S+/, '').trim();
            
            if (photoUrl) {
              await sendPhoto(env, chatId, photoUrl, caption, gardenBackKB());
            } else {
              await sendKB(env, chatId, caption, gardenBackKB(), msgId);
            }
            return new Response("OK");
          }
        }
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
        
        // RAG SEARCH
        if (text.startsWith("/search ") || text.startsWith("/rag ")) {
          const query = text.replace("/search ", "").replace("/rag ", "");
          const ragReply = await ragSearch(env, query, uid);
          await sendMsg(env.BOT_TOKEN, chatId, ragReply);
          return new Response("OK");
        }

        let reply = "";

        if (text === "/start") {
          reply = `👋 Привет, ${name}!\n\nЯ Aiden PRO.\n\n🏫 Школа + ВУЗ\n🌿 Сад и огород\n🎓 AI-репетитор (7 дней!)\n💰 Инвестиции\n🌤️ Погода\n👥 Рефералы — 50⭐\n🔍 /search — RAG поиск\n\n📢 Подпишись:\n• @investora_zametki\n• @${MY_TELEGRAM}\n\nЖми кнопки!`;
          await sendKB(env, chatId, reply, mainKB());
          return new Response("OK");
        }
        
        if (text === "/help") {
          reply = "📖 СПРАВКА\n\n/school [предмет]\n/university [предмет]\n/tutor — AI-репетитор\n/paid — PREMIUM\n/ref — рефералы\n/weather [город]\n/garden — сад и огород\n/search [запрос] — RAG поиск\n/stats — статистика (admin)";
          await sendKB(env, chatId, reply, helpKB());
          return new Response("OK");
        }

        if (text === "/garden") {
          reply = "🌿 САД И ОГОРОД\n\nВыбери культуру:";
          await sendKB(env, chatId, reply, gardenKB());
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
  
  // AUTO POSTING - SCHEDULER
  async scheduled(event, env, ctx) {
    console.log("Cron triggered:", event.scheduledTime);
    
    const now = new Date();
    const hour = now.getUTCHours();
    const day = now.getUTCDay();
    
    // Определяем тип поста по времени
    let postType = "morning";
    let channel = CHANNEL_ID;
    
    if (hour >= 9 && hour < 12) {
      postType = "morning";
    } else if (hour >= 12 && hour < 17) {
      postType = "afternoon";
    } else if (hour >= 17) {
      postType = "evening";
    }
    
    // Генерируем контент через AI
    const topic = POST_TOPICS[Math.floor(Math.random() * POST_TOPICS.length)];
    const aiPrompt = `Напиши короткий пост (до 500 символов) про: ${topic}. Добавь эмодзи. Будь полезным!`;
    const content = await ai(env, aiPrompt);
    
    // Выбираем шаблон
    const templates = POST_TEMPLATES[postType];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const finalPost = template.replace("{content}", content);
    
    // Отправляем пост
    try {
      await sendMsg(env.BOT_TOKEN, channel, finalPost);
      console.log("Post sent successfully");
      
      // Логируем в D1
      await env.DB.prepare(
        "INSERT INTO posts (topic, content, status, published_at) VALUES (?, ?, 'published', ?)"
      ).bind(topic, finalPost, new Date().toISOString()).run();
    } catch (e) {
      console.error("Post error:", e);
      await env.DB.prepare(
        "INSERT INTO posts (topic, content, status, error_message) VALUES (?, ?, 'failed', ?)"
      ).bind(topic, finalPost, e.message).run();
    }
  }
};

// === FUNCTIONS ===

// RAG SEARCH - Workers AI + KV
async function ragSearch(env, query, userId) {
  try {
    // 1. Генерируем эмбеддинг запроса через Workers AI
    const embedding = await env.ai.run("@cf/baai/bge-small-en-v1.5", {
      text: [query]
    });
    const queryVector = embedding.data[0];
    
    // 2. Ищем похожие чанки в KV (упрощённый поиск по ключам)
    const allKeys = [];
    let cursor = null;
    do {
      const result = await env.RAG_STORE.list({ 
        prefix: "chunk_", 
        cursor,
        limit: 100 
      });
      allKeys.push(...result.keys);
      cursor = result.cursor;
    } while (cursor);
    
    // 3. Для демо - возвращаем последние сохранённые чанки
    // В продакшене нужен Vectorize для cosine similarity
    let results = [];
    for (let i = 0; i < Math.min(allKeys.length, 5); i++) {
      const chunk = await env.RAG_STORE.get(allKeys[i].name);
      if (chunk) results.push(chunk);
    }
    
    if (results.length === 0) {
      // Если ничего нет - используем AI для ответа
      const aiAnswer = await ai(env, `Ответь на вопрос: ${query}. Будь краток (до 300 символов).`);
      return `🔍 RAG поиск:\n\n${aiAnswer}\n\n💡 Добавь документы через /upload`;
    }
    
    // 4. Формируем ответ
    let answer = `🔍 Найдено: ${results.length}\n\n`;
    answer += results.slice(0, 3).join("\n\n---\n\n");
    
    // 5. Добавляем AI-саммари
    const summary = await ai(env, `Сделай краткое резюме (до 200 символов) на основе:\n${results.join("\n")}\n\nВопрос: ${query}`);
    answer += `\n\n💡 **ИИ отвечает:**\n${summary}`;
    
    return answer;
  } catch (e) {
    console.error("RAG error:", e);
    return "❌ Ошибка RAG поиска. Попробуйте позже.";
  }
}

// AI GENERATION

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
  try {
    // Показываем "печатает..." перед отправкой
    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendChatAction`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({chat_id: chatId, action: "typing"})
    });
    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({chat_id: chatId, text: text, reply_markup: JSON.stringify(kb), reply_to_message_id: msgId})});
  }
  catch(e) {}
}

// Отправка фото с текстом
async function sendPhoto(env, chatId, photoUrl, caption, kb) {
  try {
    // Показываем "печатает..." перед отправкой
    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendChatAction`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({chat_id: chatId, action: "typing"})
    });
    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: caption,
        reply_markup: kb ? JSON.stringify(kb) : undefined
      })
    });
  } catch(e) {
    console.error("sendPhoto error:", e);
  }
}

function sendMsg(token, chatId, text) {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({chat_id: chatId, text: text})}).then(r => r.json());
}

async function delMsg(token, chatId, msgId) {
  await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({chat_id: chatId, message_id: msgId})});
}

// === KEYBOARDS ===

function mainKB() { return {inline_keyboard: [[{text:"🏫 Школа",callback_data:"school_main"},{text:"🎓 ВУЗ",callback_data:"uni_main"}],[{text:"🌿 Сад",callback_data:"garden_main"},{text:"🎓 AI",callback_data:"tutor_main"}],[{text:"💎 PREMIUM",callback_data:"paid_main"},{text:"👥 Рефералы",callback_data:"referral_main"}],[{text:"📢 Подписаться",callback_data:"subscribe_main"}],[{text:"💰 Инвест",callback_data:"invest_main"},{text:"₿ Крипта",callback_data:"crypto_main"}],[{text:"📊 Бизнес",callback_data:"business_main"}],[{text:"🌤️ Погода",callback_data:"weather_main"},{text:"📊 Инфляция",callback_data:"inflation_main"}]]}; }
function schoolKB() { const kb=[]; let row=[]; for(let i=0;i<SCHOOL.length;i++){row.push({text:SCHOOL[i],callback_data:"school_"+SCHOOL[i]});if(row.length===2||i===SCHOOL.length-1){kb.push(row);row=[];}} kb.push([{text:"🔙 Назад",callback_data:"back_main"}]); return {inline_keyboard: kb}; }
function uniKB() { const kb=[]; let row=[]; for(let i=0;i<UNI.length;i++){row.push({text:UNI[i],callback_data:"uni_"+UNI[i]});if(row.length===2||i===UNI.length-1){kb.push(row);row=[];}} kb.push([{text:"🔙 Назад",callback_data:"back_main"}]); return {inline_keyboard: kb}; }
function gardenKB() { const kb=[]; let row=[]; for(let i=0;i<GARDEN.length;i++){row.push({text:GARDEN[i],callback_data:"garden_"+GARDEN[i].replace(/^[^ ]+ /,"")});if(row.length===2||i===GARDEN.length-1){kb.push(row);row=[];}} kb.push([{text:"🔙 Назад",callback_data:"back_main"}]); return {inline_keyboard: kb}; }
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
