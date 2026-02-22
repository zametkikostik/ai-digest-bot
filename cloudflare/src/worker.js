/**
 * AI Digest Bot - FAST UNIVERSAL EDUCATION (оптимизированная версия)
 */
const CHANNEL_ID = "-1001859702206";
const ADMIN_IDS = ["1271633868"];

// Быстрые ответы для кнопок (без AI)
const QUICK_RESPONSES = {
  "school_Математика": "🏫 **МАТЕМАТИКА**\n\n📚 Темы:\n• Алгебра\n• Геометрия\n• Тригонометрия\n• Производные\n\nНапиши задачу — решу!",
  "school_Алгебра": "🏫 **АЛГЕБРА**\n\n📚 Темы:\n• Уравнения\n• Неравенства\n• Функции\n• Логарифмы\n\nНапиши задачу!",
  "school_Физика": "🏫 **ФИЗИКА**\n\n📚 Темы:\n• Механика\n• Электричество\n• Оптика\n• Термодинамика\n\nЗадай вопрос!",
  "school_Химия": "🏫 **ХИМИЯ**\n\n📚 Темы:\n• Органическая\n• Неорганическая\n• Реакции\n• Расчёты\n\nСпроси!",
  "uni_Высшая математика": "🎓 **ВЫСШАЯ МАТЕМАТИКА**\n\n📚 Темы:\n• Интегралы\n• Производные\n• Ряды\n• Дифуры\n\nЗадай задачу!",
  "uni_Программирование": "🎓 **ПРОГРАММИРОВАНИЕ**\n\n📚 Темы:\n• Python\n• JavaScript\n• Алгоритмы\n• Структуры данных\n\nЗадай вопрос!",
  "uni_Базы данных": "🎓 **БАЗЫ ДАННЫХ**\n\n📚 Темы:\n• SQL\n• PostgreSQL\n• MySQL\n• MongoDB\n\nСпроси!",
};

// Инфляция (кэшированные данные)
const INFLATION_CACHE = {
  "Россия": {rate: "7.5", trend: "📈"},
  "США": {rate: "3.2", trend: "📉"},
  "Болгария": {rate: "4.8", trend: "➡️"},
  "Германия": {rate: "2.9", trend: "📉"},
  "Китай": {rate: "2.1", trend: "➡️"},
  "ЕС": {rate: "2.9", trend: "📉"}
};

export default {
  async fetch(request, env) {
    try {
      if (request.method === "GET") {
        return new Response("AI Digest Bot 🤖\nFast Education");
      }
      
      if (request.method === "POST") {
        const update = await request.json();
        
        // Callback query — БЫСТРЫЕ ОТВЕТЫ
        if (update.callback_query) {
          const callback = update.callback_query;
          const chatId = callback.message.chat.id;
          const data = callback.data;
          const userId = callback.from.id.toString();
          
          // Мгновенный ответ для кнопок
          const quickReply = QUICK_RESPONSES[data];
          if (quickReply) {
            await sendWithKeyboard(env, chatId, quickReply, getBackKeyboard(), callback.message.message_id);
            return new Response("OK");
          }
          
          // Инфляция — мгновенно из кэша
          if (data.startsWith("inflation_")) {
            const country = data.replace("inflation_", "");
            const infData = INFLATION_CACHE[country];
            const reply = infData 
              ? `📊 **${country}**: ${infData.rate}% ${infData.trend}\n\n_Данные обновляются_`
              : "❌ Нет данных";
            await sendWithKeyboard(env, chatId, reply, getBackKeyboard(), callback.message.message_id);
            return new Response("OK");
          }
          
          // Новости — быстрый заголовок
          if (data.startsWith("news_")) {
            const cat = data.replace("news_", "");
            const reply = `📰 **НОВОСТИ: ${cat}**\n\nЗагрузка...\n\n(Используй /news ${cat} для подробностей)`;
            await sendWithKeyboard(env, chatId, reply, getBackKeyboard(), callback.message.message_id);
            return new Response("OK");
          }
          
          // Назад — мгновенно
          if (data === "back_main") {
            await sendWithKeyboard(env, chatId, "🔙 **Главное меню**", getMainKeyboard(), callback.message.message_id);
            return new Response("OK");
          }
          
          // Меню — мгновенно
          if (data === "school_main") {
            await sendWithKeyboard(env, chatId, "🏫 **ШКОЛЬНЫЕ ПРЕДМЕТЫ**", getSchoolKeyboard(), callback.message.message_id);
            return new Response("OK");
          }
          
          if (data === "uni_main") {
            await sendWithKeyboard(env, chatId, "🎓 **ВУЗОВСКИЕ ПРЕДМЕТЫ**", getUniversityKeyboard(), callback.message.message_id);
            return new Response("OK");
          }
          
          if (data === "code_main") {
            await sendWithKeyboard(env, chatId, "💻 **ПРОГРАММИРОВАНИЕ**", getCodeKeyboard(), callback.message.message_id);
            return new Response("OK");
          }
          
          if (data === "economy_main") {
            await sendWithKeyboard(env, chatId, "📈 **ЭКОНОМИКА**", getEconomyKeyboard(), callback.message.message_id);
            return new Response("OK");
          }
          
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
          const mentionedInGroup = isGroup && (text.includes("@AidenHelpbot") || msg.reply_to_message?.from?.is_bot);
          
          if (isGroup && !mentionedInGroup) return new Response("OK");
          
          let reply = "";
          
          // === БЫСТРЫЕ КОМАНДЫ ===
          if (text === "/start") {
            reply = `👋 Привет, ${name}!

Я — **Aiden EDU**, быстрый AI-помощник.

🏫 **Школа**: Мат, физ, хим
🎓 **ВУЗ**: Вышмат, программирование
💻 **Код**: Python, JS, Solidity
📰 **Новости**: Аналитика
📊 **Инфляция**: Все страны
🔤 **Языки**: Перевод

**Жми кнопки!** 👇`;
            await sendWithKeyboard(env, chatId, reply, getMainKeyboard());
            return new Response("OK");
            
          } else if (text === "/help") {
            reply = `📖 **БЫСТРАЯ СПРАВКА:**

**Кнопки внизу — жми!**

**Или команды:**
/school [предмет]
/solve [задача]
/code [задача]
/inflation [страна]
/news [категория]
/translate [текст]`;
            await sendWithKeyboard(env, chatId, reply, getHelpKeyboard());
            return new Response("OK");
            
          } else if (text === "/solve" || text.startsWith("/solve ")) {
            const problem = text.replace("/solve ", "").trim();
            reply = problem ? await solveProblem(env, uid, problem) : "⚠️ Напиши задачу!";
            
          } else if (text === "/code" || text.startsWith("/code ")) {
            const task = text.replace("/code ", "").trim();
            reply = task ? await writeCode(env, uid, task) : "⚠️ Опиши задачу!";
            
          } else if (text === "/solidity" || text.startsWith("/solidity ")) {
            const contract = text.replace("/solidity ", "").trim();
            reply = contract ? await writeSolidity(env, uid, contract) : "⚠️ Опиши контракт!";
            
          } else if (text === "/inflation" || text.startsWith("/inflation ")) {
            const country = text.replace("/inflation ", "").trim();
            if (!country) {
              await sendWithKeyboard(env, chatId, "📊 **ИНФЛЯЦИЯ**\n\nЖми страну:", getInflationKeyboard());
              return new Response("OK");
            }
            const infData = INFLATION_CACHE[country];
            reply = infData ? `📊 **${country}**: ${infData.rate}% ${infData.trend}` : "❌ Нет данных";
            
          } else if (text === "/translate" || text.startsWith("/translate ")) {
            const textToTranslate = text.replace("/translate ", "").trim();
            reply = textToTranslate ? await translateText(env, uid, textToTranslate) : "⚠️ Напиши текст!";
            
          } else if (text === "/ask" || text.startsWith("/ask ")) {
            const q = text.replace("/ask ", "").trim();
            reply = q ? await universalAnswer(env, uid, q) : "⚠️ Задай вопрос!";
            
          } else if (text === "/school" || text.startsWith("/school ")) {
            const subj = text.replace("/school ", "").trim();
            reply = `🏫 **{subj}**\n\nНапиши задачу или тему!`;
            
          } else if (text === "/news" || text.startsWith("/news ")) {
            const cat = text.replace("/news ", "").trim();
            reply = await getNews(env, uid, cat || "Главные");
            
          } else if (text === "/digest") {
            reply = await getDailyDigest(env, uid);
            
          } else if (text === "/memory") {
            const conv = await getConversation(env, uid);
            reply = conv.length > 0 
              ? `💭 **Диалоги**:\n\n` + conv.slice(-4).map(m => m.role==="user"?`❓ ${m.content.slice(0,50)}`:"").join("\n")
              : "💭 Память пуста";
            
          } else if (text === "/post" && ADMIN_IDS.includes(uid)) {
            const topic = text.replace("/post ", "").trim();
            const post = await generatePost(env, topic);
            const result = await sendMsg(env.BOT_TOKEN, CHANNEL_ID, post);
            reply = result.ok ? "✅ Опубликовано!" : `❌ ${result.description}`;
            
          } else if (text.startsWith("/")) {
            reply = `❓ Неизвестная команда. /help`;
            
          } else {
            const cleanText = text.replace("@AidenHelpbot", "").trim();
            reply = await universalAnswer(env, uid, cleanText);
          }
          
          if (reply) {
            if (isGroup) reply = `${name}, ${reply}`;
            await sendMsg(env.BOT_TOKEN, chatId, reply);
          }
        }
        
        return new Response("OK");
        
      }
      
      return new Response("No");
      
    } catch (e) {
      console.error("Error:", e);
      return new Response("Error: " + e.message, {status: 500});
    }
  },
  
  async scheduled(event, env) {
    const hour = new Date().getUTCHours();
    if (hour === 6) await sendMsg(env.BOT_TOKEN, CHANNEL_ID, await getDailyDigest(env, "auto"));
    if (hour === 12) await sendMsg(env.BOT_TOKEN, CHANNEL_ID, await getNews(env, "auto", "Технологии"));
    if (hour === 18) await sendMsg(env.BOT_TOKEN, CHANNEL_ID, await getWorldNews(env, "auto", "Мир"));
  }
};

// === КЛАВИАТУРЫ ===

function getMainKeyboard() {
  return {
    inline_keyboard: [
      [{text: "🏫 Школа", callback_data: "school_main"},
       {text: "🎓 ВУЗ", callback_data: "uni_main"}],
      [{text: "💻 Код", callback_data: "code_main"},
       {text: "📊 Инфляция", callback_data: "economy_main"}],
      [{text: "📰 Новости", callback_data: "news_main"},
       {text: "🔤 Перевод", callback_data: "translate_main"}],
      [{text: "📖 Справка", callback_data: "help_main"}]
    ]
  };
}

function getSchoolKeyboard() {
  return {
    inline_keyboard: [
      [{text: "Математика", callback_data: "school_Математика"},
       {text: "Физика", callback_data: "school_Физика"}],
      [{text: "Химия", callback_data: "school_Химия"},
       {text: "Алгебра", callback_data: "school_Алгебра"}],
      [{text: "🔙 Назад", callback_data: "back_main"}]
    ]
  };
}

function getUniversityKeyboard() {
  return {
    inline_keyboard: [
      [{text: "Высшая математика", callback_data: "uni_Высшая математика"},
       {text: "Программирование", callback_data: "uni_Программирование"}],
      [{text: "Базы данных", callback_data: "uni_Базы данных"},
       {text: "🔙 Назад", callback_data: "back_main"}]
    ]
  };
}

function getInflationKeyboard() {
  return {
    inline_keyboard: [
      [{text: "🇷🇺 Россия", callback_data: "inflation_Россия"},
       {text: "🇺🇸 США", callback_data: "inflation_США"}],
      [{text: "🇧🇬 Болгария", callback_data: "inflation_Болгария"},
       {text: "🇩🇪 Германия", callback_data: "inflation_Германия"}],
      [{text: "🇨🇳 Китай", callback_data: "inflation_Китай"},
       {text: "🇪🇺 ЕС", callback_data: "inflation_ЕС"}],
      [{text: "🔙 Назад", callback_data: "back_main"}]
    ]
  };
}

function getNewsKeyboard() {
  return {
    inline_keyboard: [
      [{text: "🌍 Мир", callback_data: "news_Мир"},
       {text: "💻 Технологии", callback_data: "news_Технологии"}],
      [{text: "📊 Бизнес", callback_data: "news_Бизнес"},
       {text: "🔙 Назад", callback_data: "back_main"}]
    ]
  };
}

function getEconomyKeyboard() {
  return {
    inline_keyboard: [
      [{text: "💹 Инфляция", callback_data: "inflation_Все"},
       {text: "💱 Курсы", callback_data: "economy_rates"}],
      [{text: "🔙 Назад", callback_data: "back_main"}]
    ]
  };
}

function getCodeKeyboard() {
  return {
    inline_keyboard: [
      [{text: "🐍 Python", callback_data: "code_python"},
       {text: "🌐 JavaScript", callback_data: "code_js"}],
      [{text: "⛓️ Solidity", callback_data: "code_solidity"},
       {text: "🔙 Назад", callback_data: "back_main"}]
    ]
  };
}

function getHelpKeyboard() {
  return {
    inline_keyboard: [[{text: "🔙 Главное меню", callback_data: "back_main"}]]
  };
}

function getBackKeyboard() {
  return {inline_keyboard: [[{text: "🔙 В главное меню", callback_data: "back_main"}]]};
}

async function sendWithKeyboard(env, chatId, text, keyboard, messageId = null) {
  try {
    const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`;
    const body = {chat_id: chatId, text: text, parse_mode: "Markdown", reply_markup: JSON.stringify(keyboard)};
    if (messageId) body.reply_to_message_id = messageId;
    await fetch(url, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)});
  } catch (e) { console.error(e); }
}

// === AI ФУНКЦИИ (только когда нужно) ===

async function solveProblem(env, userId, problem) {
  const answer = await askAI(env, "Реши задачу пошагово.", problem);
  await saveConversation(env, userId, [{role:"user",content:`Solve: ${problem}`},{role:"assistant",content:answer}]);
  return `🧮 **РЕШЕНИЕ**:\n\n${answer}`;
}

async function writeCode(env, userId, task) {
  const answer = await askAI(env, "Напиши код с комментариями.", `Код: ${task}`);
  await saveConversation(env, userId, [{role:"user",content:`Code: ${task}`},{role:"assistant",content:answer}]);
  return `💻 **КОД**:\n\n${answer}`;
}

async function writeSolidity(env, userId, contractType) {
  const answer = await askAI(env, "Напиши Solidity контракт.", `Solidity: ${contractType}`);
  await saveConversation(env, userId, [{role:"user",content:`Solidity: ${contractType}`},{role:"assistant",content:answer}]);
  return `⛓️ **SOLIDITY**:\n\n${answer}`;
}

async function translateText(env, userId, text) {
  const answer = await askAI(env, "Переведи текст.", `Переведи: ${text}`);
  await saveConversation(env, userId, [{role:"user",content:`Translate: ${text}`},{role:"assistant",content:answer}]);
  return `🔤 **ПЕРЕВОД**:\n\n${answer}`;
}

async function universalAnswer(env, userId, question) {
  const answer = await askAI(env, "Ты Aiden. Отвечай кратко.", question);
  await saveConversation(env, userId, [{role:"user",content:question},{role:"assistant",content:answer}]);
  return answer;
}

async function getNews(env, userId, category) {
  const answer = await askAI(env, "Новости.", `Новости: ${category}`);
  if (userId !== "auto") await saveConversation(env, userId, [{role:"user",content:`News: ${category}`},{role:"assistant",content:answer}]);
  return answer;
}

async function getDailyDigest(env, userId) {
  const answer = await askAI(env, "Дайджест за " + new Date().toLocaleDateString('ru-RU'), "Дайджест");
  if (userId !== "auto") await saveConversation(env, userId, [{role:"user",content:"Digest"},{role:"assistant",content:answer}]);
  return answer;
}

async function getWorldNews(env, userId, country) {
  const answer = await askAI(env, "Новости.", `Новости: ${country}`);
  if (userId !== "auto") await saveConversation(env, userId, [{role:"user",content:`World: ${country}`},{role:"assistant",content:answer}]);
  return answer;
}

async function getConversation(env, userId) {
  try { const data = await env.CONVERSATION_STORE.get(`conv_${userId}`); return data ? JSON.parse(data) : []; }
  catch { return []; }
}

async function saveConversation(env, userId, messages, max = 10) {
  try {
    let conv = await getConversation(env, userId);
    conv = conv.concat(messages);
    if (conv.length > max) conv = conv.slice(-max);
    await env.CONVERSATION_STORE.put(`conv_${userId}`, JSON.stringify(conv));
  } catch (e) { console.error(e); }
}

async function askAI(env, system, user) {
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {"Authorization": "Bearer " + env.OPENROUTER_API_KEY, "Content-Type": "application/json", "HTTP-Referer": "https://your-bot.com", "X-Title": "AidenBot"},
      body: JSON.stringify({model: "mistralai/mistral-7b-instruct:free", messages: [{role:"system",content: system}, {role:"user",content: user}], max_tokens: 800})
    });
    if (!r.ok) throw new Error(`API ${r.status}`);
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "Не могу ответить";
  } catch(e) { return "Ошибка: " + e.message; }
}

async function generatePost(env, topic) {
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", headers: {"Authorization": "Bearer " + env.OPENROUTER_API_KEY, "Content-Type": "application/json"},
      body: JSON.stringify({model: "qwen/qwen3-235b-a22b:free", messages: [{role:"system",content:"Пост."}, {role:"user",content:"Тема: "+topic}], max_tokens: 1000})
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content || `📝 ${topic}`;
  } catch(e) { return `📝 ${topic}`; }
}

function sendMsg(token, chatId, text) {
  return fetch("https://api.telegram.org/bot"+token+"/sendMessage", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({chat_id:chatId, text:text, parse_mode:"Markdown"})}).then(r=>r.json());
}
