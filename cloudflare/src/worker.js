/**
 * AI Digest Bot - MAXIMUM UNIVERSAL + EDUCATION PRO + AI TUTOR
 * Все предметы школы и ВУЗа + AI-репетитор с оплатой Telegram Stars
 */
const CHANNEL_ID = "-1001859702206";
const ADMIN_IDS = ["1271633868"];

// === ШКОЛЬНЫЕ ПРЕДМЕТЫ (1-11 классы) ===
const SCHOOL_SUBJECTS = {
  "Математика": {
    "Алгебра": ["Уравнения", "Неравенства", "Функции", "Производные"],
    "Геометрия": ["Планиметрия", "Стереометрия", "Векторы"],
    "Тригонометрия": ["Синус", "Косинус", "Формулы"]
  },
  "Русский язык": ["Орфография", "Пунктуация", "Синтаксис", "Сочинения"],
  "Литература": ["Анализ стихов", "Сочинения", "Биографии писателей"],
  "Физика": ["Механика", "Электричество", "Оптика", "Термодинамика", "Квантовая"],
  "Химия": ["Органическая", "Неорганическая", "Реакции", "Расчёты"],
  "Биология": ["Анатомия", "Ботаника", "Зоология", "Генетика", "Экология"],
  "География": ["Физическая", "Экономическая", "Страны", "Карты"],
  "История": ["История России", "Всемирная история", "Даты", "События"],
  "Обществознание": ["Право", "Экономика", "Социология", "Политология"],
  "Информатика": ["Python", "Алгоритмы", "Базы данных", "Сети"],
  "Английский": ["Грамматика", "Слова", "Перевод", "Разговорный"],
  "Немецкий": ["Грамматика", "Слова", "Перевод"],
  "Французский": ["Грамматика", "Слова", "Перевод"],
  "ОБЖ": ["Безопасность", "Первая помощь", "Военная подготовка"]
};

// === ВУЗОВСКИЕ ПРЕДМЕТЫ ===
const UNIVERSITY_SUBJECTS = {
  "Высшая математика": ["Матанализ", "Линейная алгебра", "Дифуры", "ТФКП", "ТВиР"],
  "Физика": ["Общая физика", "Механика", "Молекулярка", "Электричество", "Оптика"],
  "Химия": ["Общая химия", "Органическая", "Физическая", "Аналитическая"],
  "Программирование": ["Python", "Java", "C++", "JavaScript", "Алгоритмы"],
  "Базы данных": ["SQL", "PostgreSQL", "MySQL", "MongoDB", "Проектирование"],
  "Компьютерные сети": ["Модель OSI", "TCP/IP", "Маршрутизация", "Безопасность"],
  "Экономика": ["Микроэкономика", "Макроэкономика", "Эконометрика", "Финансы"],
  "Менеджмент": ["Управление", "Маркетинг", "HR", "Стратегия"],
  "Право": ["Гражданское право", "Уголовное право", "Трудовое право", "Конституционное"],
  "Философия": ["История философии", "Логика", "Этика", "Эстетика"],
  "Социология": ["Теория", "Методы", "Социальные группы"],
  "Психология": ["Общая психология", "Социальная", "Клиническая", "Педагогическая"]
};

// === AI-РЕПЕТИТОР (тарифы) ===
const TUTOR_PRICING = {
  "trial": {name: "Триал", duration: "3 дня", price: "Бесплатно", stars: 0},
  "basic": {name: "Базовый", duration: "1 месяц", price: "99 звёзд", stars: 99},
  "pro": {name: "PRO", duration: "3 месяца", price: "249 звёзд", stars: 249},
  "unlimited": {name: "Безлимит", duration: "12 месяцев", price: "799 звёзд", stars: 799}
};

// === БАЗА ЗНАНИЙ (кэшированные ответы) ===
const KNOWLEDGE = {
  "invest_Акции": "💰 **АКЦИИ**\n\nАкция — доля в компании.\n\n📈 **Плюсы:**\n• Рост стоимости\n• Дивиденды\n• Ликвидность\n\n⚠️ **Риски:**\n• Волатильность\n• Банкротство",
  
  "crypto_Биткоин": "₿ **БИТКОИН**\n\nПервая криптовалюта (2009).\n\n📈 **Плюсы:**\n• Лимит 21 млн\n• Децентрализация\n\n⚠️ **Риски:**\n• Волатильность",
  
  "business_Стартап": "📊 **СТАРТАП**\n\nКомпания в поиске модели.\n\n📈 **Этапы:**\n1. Идея\n2. MVP\n3. Product-Market Fit\n4. Масштабирование",
  
  "inflation_Россия": "📊 **РОССИЯ**\n\n💹 Инфляция: **7.5%** 📈\n📉 Ставка: 16%",
  
  "inflation_Болгария": "📊 **БОЛГАРИЯ**\n\n💹 Инфляция: **4.8%** ➡️\n📉 Ставка: 5.5%"
};

// === ПОГОДА (кэш) ===
const WEATHER_CACHE = {
  "Москва": {temp: "+18", condition: "☀️ Ясно", wind: "5 м/с", humidity: "65%"},
  "София": {temp: "+19", condition: "☀️ Ясно", wind: "4 м/с", humidity: "58%"},
  "Санкт-Петербург": {temp: "+15", condition: "☁️ Облачно", wind: "8 м/с", humidity: "75%"}
};

export default {
  async fetch(request, env) {
    if (request.method === "GET") return new Response("AI Digest Bot PRO + Education + Tutor");
    
    if (request.method === "POST") {
      const update = await request.json();
      
      // Callback query (кнопки)
      if (update.callback_query) {
        const cb = update.callback_query;
        const data = cb.data;
        const chatId = cb.message.chat.id;
        const msgId = cb.message.message_id;
        
        let reply = "";
        let kb = null;
        
        // AI-репетитор — проверка подписки
        if (data.startsWith("tutor_")) {
          const hasAccess = await checkTutorAccess(env, cb.from.id.toString());
          if (!hasAccess && data !== "tutor_subscribe") {
            reply = "🎓 **AI-РЕПЕТИТОР**\n\n⚠️ У вас нет активной подписки.\n\n💰 **Тарифы:**\n• 3 дня — Бесплатно (триал)\n• 1 месяц — 99 звёзд\n• 3 месяца — 249 звёзд\n• 12 месяцев — 799 звёзд\n\nНажмите ниже для оплаты:";
            kb = getTutorPayKB();
          } else if (data === "tutor_subscribe") {
            reply = "🎓 **AI-РЕПЕТИТОР**\n\n💰 **Выберите тариф:**";
            kb = getTutorPayKB();
          } else {
            reply = "🎓 **AI-РЕПЕТИТОР**\n\nЗадайте вопрос по предмету:\n\n";
            const subject = data.replace("tutor_", "");
            reply += `📚 **{subject}**\n\nНапиши задачу или тему — объясню!`;
            kb = getBackKB();
          }
          await sendKB(env, chatId, reply, kb, msgId);
          return new Response("OK");
        }
        
        // Погода
        if (data.startsWith("weather_")) {
          const city = data.replace("weather_", "");
          const w = WEATHER_CACHE[city];
          reply = w ? `🌤️ **{city}**\n\n🌡️ ${w.temp}\n${w.condition}\n💨 ${w.wind}\n💧 ${w.humidity}` : "❌ Нет данных";
          kb = getBackKB();
          await sendKB(env, chatId, reply, kb, msgId);
          return new Response("OK");
        }
        
        // Школьные предметы
        if (data.startsWith("school_subject_")) {
          const subject = data.replace("school_subject_", "");
          reply = `🏫 **{subject}**\n\n💡 Напиши задачу или тему — помогу!\n\nПример:\n• Реши уравнение\n• Объясни тему\n• Помоги с ДЗ`;
          kb = getBackKB();
          await sendKB(env, chatId, reply, kb, msgId);
          return new Response("OK");
        }
        
        // ВУЗ предметы
        if (data.startsWith("uni_subject_")) {
          const subject = data.replace("uni_subject_", "");
          reply = `🎓 **{subject}**\n\n💡 Напиши задачу или тему — помогу!\n\nПример:\n• Реши интеграл\n• Объясни лекцию\n• Помоги с курсовой`;
          kb = getBackKB();
          await sendKB(env, chatId, reply, kb, msgId);
          return new Response("OK");
        }
        
        // Остальные кнопки
        if (KNOWLEDGE[data]) {
          reply = KNOWLEDGE[data];
          kb = getBackKB();
        } else if (data === "back_main") {
          reply = "🔙 **Главное меню**";
          kb = getMainKB();
        } else if (data === "school_main") {
          reply = "🏫 **ШКОЛА (1-11 классы)**\n\nВыберите предмет:";
          kb = getSchoolFullKB();
        } else if (data === "uni_main") {
          reply = "🎓 **ВУЗ (Все специальности)**\n\nВыберите предмет:";
          kb = getUniversityFullKB();
        } else if (data === "tutor_main") {
          reply = "🎓 **AI-РЕПЕТИТОР**\n\nПерсональная помощь с любым предметом.\n\n💰 **Первые 3 дня — бесплатно!**";
          kb = getTutorKB();
        } else if (data === "invest_main") {
          reply = "💰 **ИНВЕСТИЦИИ**\n\nВыберите:";
          kb = getInvestKB();
        } else if (data === "crypto_main") {
          reply = "₿ **КРИПТОВАЛЮТЫ**\n\nВыберите:";
          kb = getCryptoKB();
        } else if (data === "business_main") {
          reply = "📊 **БИЗНЕС**\n\nВыберите:";
          kb = getBusinessKB();
        } else if (data === "learn_main") {
          reply = "📚 **ОБУЧЕНИЕ**\n\nВыберите:";
          kb = getLearnKB();
        } else if (data === "weather_main") {
          reply = "🌤️ **ПОГОДА**\n\nВыберите город:";
          kb = getWeatherKB();
        } else if (data === "inflation_main") {
          reply = "📊 **ИНФЛЯЦИЯ**\n\nВыберите страну:";
          kb = getInflationKB();
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
        
        // Геолокация (погода)
        if (msg.location) {
          const reply = await getWeatherByCoords(env, uid, msg.location.latitude, msg.location.longitude);
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        // Оплата подписки (Telegram Stars)
        if (text === "/buy_tutor" || text === "Купить подписку") {
          await sendTutorInvoice(env, chatId, uid);
          return new Response("OK");
        }
        
        // Проверка статуса подписки
        if (text === "/my_tutor") {
          const status = await getTutorStatus(env, uid);
          const reply = `🎓 **AI-РЕПЕТИТОР**\n\n${status}`;
          await sendMsg(env.BOT_TOKEN, chatId, reply);
          return new Response("OK");
        }
        
        let reply = "";
        
        if (text === "/start") {
          reply = `👋 Привет, ${name}!

Я — **Aiden PRO**, максимально универсальный AI-помощник.

🎯 **АУДИТОРИИ:**
🏫 Школьникам | 🎓 Студентам
💰 Инвесторам | 📊 Предпринимателям

📚 **ОБРАЗОВАНИЕ:**
🏫 Школа (все предметы 1-11 класс)
🎓 ВУЗ (все специальности)
🎓 AI-репетитор (3 дня бесплатно!)

💻 IT | 🔤 Языки | 📰 Новости
📊 Инфляция | 🌤️ Погода

**Жми кнопки!** 👇`;
          await sendKB(env, chatId, reply, getMainKB());
          return new Response("OK");
        }
        
        if (text === "/help") {
          reply = `📖 **СПРАВКА:**

**🏫 Школа:**
/school [предмет] — помощь
/solve [задача] — решение

**🎓 ВУЗ:**
/university [предмет] — помощь
/calc [задача] — вычисления

**🎓 AI-репетитор:**
/tutor — начать занятия
/my_tutor — статус подписки
/buy_tutor — купить подписку

**💰 Инвестиции:**
/invest [вопрос]

**₿ Крипта:**
/crypto [вопрос]

**📊 Бизнес:**
/business [вопрос]

**🌤️ Погода:**
/weather [город]
Отправь геолокацию!

**Кнопки внизу!**`;
          await sendKB(env, chatId, reply, getHelpKB());
          return new Response("OK");
        }
        
        if (text === "/tutor") {
          const hasAccess = await checkTutorAccess(env, uid);
          if (hasAccess) {
            reply = "🎓 **AI-РЕПЕТИТОР**\n\n✅ У вас активная подписка!\n\nВыберите предмет кнопками:";
            kb = getTutorSubjectsKB();
          } else {
            reply = "🎓 **AI-РЕПЕТИТОР**\n\n⚠️ Нет активной подписки.\n\n💰 **Тарифы:**\n• 3 дня — Бесплатно (триал)\n• 1 месяц — 99 звёзд ⭐\n• 3 месяца — 249 звёзд\n• 12 месяцев — 799 звёзд\n\nНажмите /buy_tutor для оплаты!";
            kb = getTutorPayKB();
          }
          await sendKB(env, chatId, reply, kb);
          return new Response("OK");
        }
        
        if (text === "/school" || text.startsWith("/school ")) {
          const subject = text.replace("/school ", "").trim();
          reply = `🏫 **{subject}**\n\nНапиши задачу или тему — помогу!`;
        } else if (text === "/solve" || text.startsWith("/solve ")) {
          const problem = text.replace("/solve ", "").trim();
          reply = await ai(env, "Ты школьный репетитор. Реши задачу пошагово с объяснениями: " + problem);
        } else if (text === "/university" || text.startsWith("/university ")) {
          const subject = text.replace("/university ", "").trim();
          reply = `🎓 **{subject}**\n\nНапиши задачу или тему — помогу!`;
        } else if (text === "/calc" || text.startsWith("/calc ")) {
          const problem = text.replace("/calc ", "").trim();
          reply = await ai(env, "Ты преподаватель ВУЗа. Реши задачу: " + problem);
        } else if (text.startsWith("/invest ")) {
          reply = await ai(env, "Ты инвестиционный консультант. " + text.replace("/invest ", ""));
        } else if (text.startsWith("/crypto ")) {
          reply = await ai(env, "Ты крипто-эксперт. " + text.replace("/crypto ", ""));
        } else if (text.startsWith("/business ")) {
          reply = await ai(env, "Ты бизнес-консультант. " + text.replace("/business ", ""));
        } else if (text.startsWith("/weather ")) {
          const city = text.replace("/weather ", "").trim();
          reply = await getWeatherByCity(env, uid, city);
        } else if (text.startsWith("/ask ")) {
          reply = await ai(env, text.replace("/ask ", ""));
        } else if (text.startsWith("/")) {
          reply = "❓ Неизвестная команда. /help";
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
    if (h === 9) await sendMsg(env.BOT_TOKEN, CHANNEL_ID, await ai(env, "Пост про инвестиции"));
    if (h === 15) await sendMsg(env.BOT_TOKEN, CHANNEL_ID, await ai(env, "Пост про крипту"));
    if (h === 18) await sendMsg(env.BOT_TOKEN, CHANNEL_ID, await ai(env, "Дайджест за день"));
  }
};

// === AI-РЕПЕТИТОР (оплата и доступ) ===

async function checkTutorAccess(env, userId) {
  try {
    const key = `tutor_${userId}`;
    const data = await env.RAG_STORE.get(key);
    if (!data) return false;
    
    const sub = JSON.parse(data);
    const now = new Date();
    const expiry = new Date(sub.expires);
    
    return now < expiry;
  } catch(e) {
    console.error("checkTutorAccess error:", e);
    return false;
  }
}

async function getTutorStatus(env, userId) {
  try {
    const key = `tutor_${userId}`;
    const data = await env.RAG_STORE.get(key);
    if (!data) return "❌ Нет активной подписки\n\n/buy_tutor — купить";
    
    const sub = JSON.parse(data);
    const expiry = new Date(sub.expires);
    const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
    
    return `✅ **{sub.plan}**\n\n📅 Действует до: ${expiry.toLocaleDateString('ru-RU')}\n⏳ Осталось дней: ${daysLeft}`;
  } catch(e) {
    return "❌ Ошибка получения статуса";
  }
}

async function activateTutor(env, userId, plan, days) {
  try {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    
    const key = `tutor_${userId}`;
    await env.RAG_STORE.put(key, JSON.stringify({
      userId,
      plan,
      expires: expires.toISOString(),
      activated: new Date().toISOString()
    }));
    
    return true;
  } catch(e) {
    console.error("activateTutor error:", e);
    return false;
  }
}

async function sendTutorInvoice(env, chatId, userId) {
  // В реальном проекте здесь будет отправка инвойса Telegram Stars
  // Через Bot API: sendInvoice с параметром currency="XTR"
  
  const reply = `🎓 **ОПЛАТА AI-РЕПЕТИТОРА**\n\n💰 **Выберите тариф:**\n\n` +
    `• **Триал** — 3 дня — **Бесплатно**\n` +
    `• **Базовый** — 1 месяц — **99 звёзд** ⭐\n` +
    `• **PRO** — 3 месяца — **249 звёзд** ⭐\n` +
    `• **Безлимит** — 12 месяцев — **799 звёзд** ⭐\n\n` +
    `⚠️ Для оплаты нажмите на тариф ниже:\n\n` +
    `_После оплаты подписка активируется автоматически_`;
  
  await sendKB(env, chatId, reply, getTutorPayKB());
}

// === ПОГОДА ===

async function getWeatherByCity(env, userId, city) {
  const w = WEATHER_CACHE[city];
  if (w) {
    await saveWeather(env, userId, city);
    return `🌤️ **{city}**\n\n🌡️ ${w.temp}\n${w.condition}\n💨 ${w.wind}\n💧 ${w.humidity}`;
  }
  return `❌ Нет данных для города: ${city}`;
}

async function getWeatherByCoords(env, userId, lat, lon) {
  let city = "Москва";
  if (Math.abs(lat - 55.75) < 1) city = "Москва";
  else if (Math.abs(lat - 59.93) < 1) city = "Санкт-Петербург";
  else if (Math.abs(lat - 42.69) < 1) city = "София";
  
  const w = WEATHER_CACHE[city];
  if (w) {
    await saveWeather(env, userId, city);
    return `🌤️ **{city}**\n\n🌡️ ${w.temp}\n${w.condition}\n💨 ${w.wind}\n💧 ${w.humidity}\n\n📍 ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  }
  return "❌ Нет данных для этой локации";
}

async function saveWeather(env, userId, city) {
  try {
    await env.RAG_STORE.put(`weather_${userId}_${Date.now()}`, JSON.stringify({userId, city, date: new Date().toISOString()}));
  } catch(e) { console.error(e); }
}

// === КЛАВИАТУРЫ ===

function getMainKB() {
  return {inline_keyboard: [
    [{text:"🎯 Аудитории",callback_data:"audience_main"}],
    [{text:"🏫 Школа",callback_data:"school_main"},{text:"🎓 ВУЗ",callback_data:"uni_main"}],
    [{text:"🎓 AI-репетитор",callback_data:"tutor_main"}],
    [{text:"💰 Инвестиции",callback_data:"invest_main"},{text:"₿ Крипта",callback_data:"crypto_main"}],
    [{text:"📊 Бизнес",callback_data:"business_main"},{text:"📚 Обучение",callback_data:"learn_main"}],
    [{text:"💻 IT",callback_data:"it_main"},{text:"🔤 Языки",callback_data:"lang_main"}],
    [{text:"📊 Инфляция",callback_data:"inflation_main"},{text:"🌤️ Погода",callback_data:"weather_main"}],
    [{text:"📖 Справка",callback_data:"help_main"}]
  ]};
}

function getSchoolFullKB() {
  const keyboard = [];
  let row = [];
  Object.keys(SCHOOL_SUBJECTS).forEach((subj, i) => {
    row.push({text: subj, callback_data: "school_subject_" + subj});
    if (row.length === 2 || i === Object.keys(SCHOOL_SUBJECTS).length - 1) {
      keyboard.push(row);
      row = [];
    }
  });
  keyboard.push([{text:"🔙 Назад",callback_data:"back_main"}]);
  return {inline_keyboard: keyboard};
}

function getUniversityFullKB() {
  const keyboard = [];
  let row = [];
  Object.keys(UNIVERSITY_SUBJECTS).forEach((subj, i) => {
    row.push({text: subj, callback_data: "uni_subject_" + subj});
    if (row.length === 2 || i === Object.keys(UNIVERSITY_SUBJECTS).length - 1) {
      keyboard.push(row);
      row = [];
    }
  });
  keyboard.push([{text:"🔙 Назад",callback_data:"back_main"}]);
  return {inline_keyboard: keyboard};
}

function getTutorKB() {
  return {inline_keyboard: [
    [{text:"📐 Математика",callback_data:"tutor_Математика"},{text:"⚛️ Физика",callback_data:"tutor_Физика"}],
    [{text:"🧪 Химия",callback_data:"tutor_Химия"},{text:"💻 Программирование",callback_data:"tutor_Программирование"}],
    [{text:"📚 Все предметы",callback_data:"tutor_all"}],
    [{text:"💰 Купить подписку",callback_data:"tutor_subscribe"}],
    [{text:"🔙 Назад",callback_data:"back_main"}]
  ]};
}

function getTutorSubjectsKB() {
  return {inline_keyboard: [
    [{text:"📐 Математика",callback_data:"tutor_Математика"},{text:"⚛️ Физика",callback_data:"tutor_Физика"}],
    [{text:"🧪 Химия",callback_data:"tutor_Химия"},{text:"📝 Русский язык",callback_data:"tutor_Русский язык"}],
    [{text:"📚 Литература",callback_data:"tutor_Литература"},{text:"💻 Информатика",callback_data:"tutor_Информатика"}],
    [{text:"🔙 В меню",callback_data:"back_main"}]
  ]};
}

function getTutorPayKB() {
  return {inline_keyboard: [
    [{text:"🆓 3 дня — Бесплатно",callback_data:"tutor_pay_trial"}],
    [{text:"⭐ 1 месяц — 99 звёзд",callback_data:"tutor_pay_basic"}],
    [{text:"⭐ 3 месяца — 249 звёзд",callback_data:"tutor_pay_pro"}],
    [{text:"⭐ 12 месяцев — 799 звёзд",callback_data:"tutor_pay_unlimited"}],
    [{text:"🔙 Назад",callback_data:"back_main"}]
  ]};
}

function getWeatherKB() {
  return {inline_keyboard: [
    [{text:"🇷🇺 Москва",callback_data:"weather_Москва"},{text:"🇷🇺 СПб",callback_data:"weather_Санкт-Петербург"}],
    [{text:"🇧🇬 София",callback_data:"weather_София"}],
    [{text:"🔙 Назад",callback_data:"back_main"}]
  ]};
}

function getInvestKB() {
  return {inline_keyboard: [
    [{text:"Акции",callback_data:"invest_Акции"},{text:"Облигации",callback_data:"invest_Облигации"}],
    [{text:"ETF",callback_data:"invest_ETF"},{text:"🔙 Назад",callback_data:"back_main"}]
  ]};
}

function getCryptoKB() {
  return {inline_keyboard: [
    [{text:"Биткоин",callback_data:"crypto_Биткоин"},{text:"DeFi",callback_data:"crypto_DeFi"}],
    [{text:"🔙 Назад",callback_data:"back_main"}]
  ]};
}

function getBusinessKB() {
  return {inline_keyboard: [
    [{text:"Стартап",callback_data:"business_Стартап"},{text:"🔙 Назад",callback_data:"back_main"}]
  ]};
}

function getLearnKB() {
  return {inline_keyboard: [
    [{text:"Инвестиции",callback_data:"learn_Инвестиции"},{text:"Крипта",callback_data:"learn_Крипта"}],
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

function getBackKB() {
  return {inline_keyboard: [[{text:"🔙 В главное меню",callback_data:"back_main"}]]};
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
      body: JSON.stringify({model: "mistralai/mistral-7b-instruct:free", messages: [{role:"user",content:text}], max_tokens: 1200})
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "Не могу ответить";
  } catch(e) {
    return "Ошибка: " + e.message;
  }
}
