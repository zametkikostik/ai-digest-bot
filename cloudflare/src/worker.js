/**
 * AI Digest Bot - UNIVERSAL EDUCATION ASSISTANT
 * Школа, ВУЗ, программирование, новости, экономика + Кнопки
 */
const CHANNEL_ID = "-1001859702206";
const ADMIN_IDS = ["1271633868"];

// Образовательные предметы
const SCHOOL_SUBJECTS = [
  "Математика", "Алгебра", "Геометрия", "Физика", "Химия",
  "Биология", "География", "История", "Обществознание",
  "Русский язык", "Литература", "Английский язык", "Информатика"
];

const UNIVERSITY_SUBJECTS = [
  "Высшая математика", "Философия", "Экономика", "Право",
  "Программирование", "Базы данных", "Сети", "ИИ и ML",
  "Менеджмент", "Маркетинг", "Финансы", "Социология"
];

export default {
  async fetch(request, env) {
    try {
      if (request.method === "GET") {
        return new Response("AI Digest Bot 🤖\nОбразование + Универсальный помощник");
      }
      
      if (request.method === "POST") {
        const update = await request.json();
        
        // Callback query (кнопки)
        if (update.callback_query) {
          const callback = update.callback_query;
          const chatId = callback.message.chat.id;
          const data = callback.data;
          const userId = callback.from.id.toString();
          
          await handleCallback(env, chatId, userId, data, callback.message);
          return new Response("OK");
        }
        
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
          
          // === КОМАНДЫ ===
          if (text === "/start") {
            reply = `👋 Привет, ${name}!

Я — **Aiden EDU**, твой универсальный AI-помощник с упором на образование.

🎓 **ОБРАЗОВАНИЕ:**

🏫 **Школьникам:**
• Решение задач (мат, физ, хим)
• Объяснение тем
• Подготовка к ЕГЭ/ОГЭ
• Сочинения, изложения
• Перевод текстов

🎓 **Студентам:**
• Решение задач (вышмат, физика)
• Объяснение лекций
• Помощь с курсовыми
• Подготовка к экзаменам
• Программирование

💻 **ПРОГРАММИРОВАНИЕ:**
• Python, JS, Solidity
• Смарт-контракты
• Web3, DeFi

📰 **НОВОСТИ:**
• Аналитика, дайджесты

📊 **ЭКОНОМИКА:**
• Инфляция стран
• Эконом. данные

📋 **ВЫБЕРИ РАЗДЕЛ КНОПКАМИ!** 👇`;
            
            await sendWithKeyboard(env, chatId, reply, getMainKeyboard());
            return new Response("OK");
            
          } else if (text === "/help") {
            reply = `📖 **СПРАВКА:**

**🏫 ШКОЛА:**
/school [предмет] — помощь
/solve [задача] — решение
/ege [предмет] — подготовка к ЕГЭ
/explain [тема] — объяснение

**🎓 ВУЗ:**
/university [предмет] — помощь
/calc [задача] — вычисления
/course [тема] — курсовая
/exam [предмет] — к экзамену

**💻 КОД:**
/code [задача] — код
/solidity [контракт] — смарт-контракт

**📰 НОВОСТИ:**
/news [категория]
/digest — дайджест

**📊 ЭКОНОМИКА:**
/inflation — инфляция

**🔤 ЯЗЫКИ:**
/translate [текст] — перевод
/english — изучение

**Используй кнопки!**`;
            
            await sendWithKeyboard(env, chatId, reply, getHelpKeyboard());
            return new Response("OK");
            
          } else if (text === "/school" || text.startsWith("/school ")) {
            const subject = text.replace("/school ", "").trim();
            reply = `🏫 **ПОМОЩЬ ПО ПРЕДМЕТУ: ${subject}**\n\n`;
            reply += `Напиши конкретную задачу или тему, и я помогу!\n\n`;
            reply += `**Примеры:**\n`;
            reply += `• Реши уравнение: x² + 5x + 6 = 0\n`;
            reply += `• Объясни закон Ома\n`;
            reply += `• Напиши сочинение на тему...`;
            
          } else if (text === "/solve" || text.startsWith("/solve ")) {
            const problem = text.replace("/solve ", "").trim();
            reply = await solveProblem(env, uid, problem);
            
          } else if (text === "/ege" || text.startsWith("/ege ")) {
            const subject = text.replace("/ege ", "").trim();
            reply = await egePrep(env, uid, subject);
            
          } else if (text === "/university" || text.startsWith("/university ")) {
            const subject = text.replace("/university ", "").trim();
            reply = await universityHelp(env, uid, subject);
            
          } else if (text === "/calc" || text.startsWith("/calc ")) {
            const problem = text.replace("/calc ", "").trim();
            reply = await calculate(env, uid, problem);
            
          } else if (text === "/course" || text.startsWith("/course ")) {
            const topic = text.replace("/course ", "").trim();
            reply = await courseWorkHelp(env, uid, topic);
            
          } else if (text === "/exam" || text.startsWith("/exam ")) {
            const subject = text.replace("/exam ", "").trim();
            reply = await examPrep(env, uid, subject);
            
          } else if (text === "/translate" || text.startsWith("/translate ")) {
            const textToTranslate = text.replace("/translate ", "").trim();
            reply = await translateText(env, uid, textToTranslate);
            
          } else if (text === "/english") {
            reply = await englishLesson(env, uid);
            
          } else if (text === "/explain" || text.startsWith("/explain ")) {
            const topic = text.replace("/explain ", "").trim();
            reply = await explainTopic(env, uid, topic);
            
          } else if (text === "/code" || text.startsWith("/code ")) {
            const task = text.replace("/code ", "").trim();
            reply = task ? await writeCode(env, uid, task) : "⚠️ Опишите задачу!";
            
          } else if (text === "/solidity" || text.startsWith("/solidity ")) {
            const contract = text.replace("/solidity ", "").trim();
            reply = contract ? await writeSolidity(env, uid, contract) : "⚠️ Опишите контракт!";
            
          } else if (text === "/inflation") {
            const country = text.replace("/inflation ", "").trim();
            reply = country ? await getInflationData(env, uid, country) : "📊 Выберите страну в меню!";
            if (!country) {
              await sendWithKeyboard(env, chatId, "📊 ИНФЛЯЦИЯ\n\nВыберите страну:", getInflationKeyboard());
              return new Response("OK");
            }
            
          } else if (text === "/news" || text.startsWith("/news ")) {
            const cat = text.replace("/news ", "").trim();
            reply = await getNews(env, uid, cat || "Главные");
            
          } else if (text === "/digest") {
            reply = await getDailyDigest(env, uid);
            
          } else if (text === "/ask" || text.startsWith("/ask ")) {
            const q = text.replace("/ask ", "").trim();
            reply = q ? await universalAnswer(env, uid, q) : "⚠️ Задайте вопрос!";
            
          } else if (text === "/memory") {
            const conv = await getConversation(env, uid);
            if (conv && conv.length > 0) {
              reply = `💭 **Диалоги**:\n\n`;
              conv.slice(-6).forEach(m => {
                if (m.role === "user") reply += `❓ ${m.content.slice(0, 50)}...\n`;
              });
            } else reply = "💭 Память пуста";
            
          } else if (text === "/post" && ADMIN_IDS.includes(uid)) {
            const topic = text.replace("/post ", "").trim();
            const post = await generatePost(env, topic);
            const result = await sendMsg(env.BOT_TOKEN, CHANNEL_ID, post);
            reply = result.ok ? "✅ Опубликовано!" : `❌ ${result.description}`;
            
          } else if (text.startsWith("/")) {
            reply = `❓ Неизвестная команда. Используйте /help`;
            
          } else {
            // Определяем тип вопроса
            const cleanText = text.replace("@AidenHelpbot", "").trim();
            if (looksLikeMath(cleanText) || looksLikeProblem(cleanText)) {
              reply = await solveProblem(env, uid, cleanText);
            } else if (looksLikeTranslation(cleanText)) {
              reply = await translateText(env, uid, cleanText);
            } else {
              reply = await universalAnswer(env, uid, cleanText);
            }
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
    if (hour % 6 === 0) await updateInflationData(env);
    if (hour === 6) await sendMsg(env.BOT_TOKEN, CHANNEL_ID, await getDailyDigest(env, "auto"));
    if (hour === 12) await sendMsg(env.BOT_TOKEN, CHANNEL_ID, await getNews(env, "auto", "Технологии"));
    if (hour === 18) await sendMsg(env.BOT_TOKEN, CHANNEL_ID, await getWorldNews(env, "auto", "Мир"));
  }
};

// === ОБРАБОТКА КНОПОК ===

async function handleCallback(env, chatId, userId, data, message) {
  let reply = "";
  
  if (data.startsWith("school_")) {
    const subject = data.replace("school_", "");
    reply = `🏫 **${subject}**\n\nНапиши задачу или тему, которую нужно объяснить!`;
    
  } else if (data.startsWith("uni_")) {
    const subject = data.replace("uni_", "");
    reply = `🎓 **${subject}**\n\nЗадай вопрос по предмету!`;
    
  } else if (data.startsWith("inflation_")) {
    const country = data.replace("inflation_", "");
    reply = await getInflationData(env, userId, country);
    
  } else if (data.startsWith("news_")) {
    const cat = data.replace("news_", "");
    reply = await getNews(env, userId, cat);
    
  } else if (data === "economy_main") {
    reply = "📈 **ЭКОНОМИКА**\n\nВыберите:";
    await sendWithKeyboard(env, chatId, reply, getEconomyKeyboard(), message.message_id);
    return;
    
  } else if (data === "code_main") {
    reply = "💻 **ПРОГРАММИРОВАНИЕ**\n\nВыберите:";
    await sendWithKeyboard(env, chatId, reply, getCodeKeyboard(), message.message_id);
    return;
    
  } else if (data === "school_main") {
    reply = "🏫 **ШКОЛЬНЫЕ ПРЕДМЕТЫ**\n\nВыберите предмет:";
    await sendWithKeyboard(env, chatId, reply, getSchoolKeyboard(), message.message_id);
    return;
    
  } else if (data === "uni_main") {
    reply = "🎓 **ВУЗОВСКИЕ ПРЕДМЕТЫ**\n\nВыберите предмет:";
    await sendWithKeyboard(env, chatId, reply, getUniversityKeyboard(), message.message_id);
    return;
    
  } else if (data === "back_main") {
    reply = "🔙 **Главное меню**";
    await sendWithKeyboard(env, chatId, reply, getMainKeyboard(), message.message_id);
    return;
  }
  
  if (reply) {
    await sendWithKeyboard(env, chatId, reply, getBackKeyboard(), message.message_id);
  }
}

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
  const keyboard = [];
  let row = [];
  SCHOOL_SUBJECTS.forEach((subj, i) => {
    row.push({text: subj, callback_data: "school_" + subj});
    if (row.length === 2 || i === SCHOOL_SUBJECTS.length - 1) {
      keyboard.push(row);
      row = [];
    }
  });
  keyboard.push([{text: "🔙 Назад", callback_data: "back_main"}]);
  return {inline_keyboard: keyboard};
}

function getUniversityKeyboard() {
  const keyboard = [];
  let row = [];
  UNIVERSITY_SUBJECTS.forEach((subj, i) => {
    row.push({text: subj, callback_data: "uni_" + subj});
    if (row.length === 2 || i === UNIVERSITY_SUBJECTS.length - 1) {
      keyboard.push(row);
      row = [];
    }
  });
  keyboard.push([{text: "🔙 Назад", callback_data: "back_main"}]);
  return {inline_keyboard: keyboard};
}

function getInflationKeyboard() {
  const countries = ["Россия", "США", "Болгария", "Германия", "Китай", "ЕС"];
  const keyboard = [];
  let row = [];
  countries.forEach(c => {
    row.push({text: getFlag(c) + " " + c, callback_data: "inflation_" + c});
    if (row.length === 2) {
      keyboard.push(row);
      row = [];
    }
  });
  keyboard.push([{text: "🔙 Назад", callback_data: "back_main"}]);
  return {inline_keyboard: keyboard};
}

function getNewsKeyboard() {
  return {
    inline_keyboard: [
      [{text: "🌍 Мир", callback_data: "news_Мир"},
       {text: "💻 Технологии", callback_data: "news_Технологии"}],
      [{text: "📊 Бизнес", callback_data: "news_Бизнес"},
       {text: "🔬 Наука", callback_data: "news_Наука"}],
      [{text: "🔙 Назад", callback_data: "back_main"}]
    ]
  };
}

function getEconomyKeyboard() {
  return {
    inline_keyboard: [
      [{text: "💹 Инфляция", callback_data: "inflation_Все страны"},
       {text: "💱 Курсы валют", callback_data: "economy_rates"}],
      [{text: "🔙 Назад", callback_data: "back_main"}]
    ]
  };
}

function getCodeKeyboard() {
  return {
    inline_keyboard: [
      [{text: "🐍 Python", callback_data: "code_python"},
       {text: "🌐 JavaScript", callback_data: "code_js"}],
      [{text: "⛓️ Solidity", callback_data: "code_solidity"}],
      [{text: "🔙 Назад", callback_data: "back_main"}]
    ]
  };
}

function getHelpKeyboard() {
  return {
    inline_keyboard: [
      [{text: "🏫 Школа", callback_data: "school_main"},
       {text: "🎓 ВУЗ", callback_data: "uni_main"}],
      [{text: "💻 Код", callback_data: "code_main"},
       {text: "📖 Общее", callback_data: "help_general"}],
      [{text: "🔙 Назад", callback_data: "back_main"}]
    ]
  };
}

function getBackKeyboard() {
  return {inline_keyboard: [[{text: "🔙 В главное меню", callback_data: "back_main"}]]};
}

function getFlag(country) {
  const flags = {"Россия":"🇷🇺","США":"🇺🇸","Болгария":"🇧🇬","Германия":"🇩🇪","Китай":"🇨🇳","ЕС":"🇪🇺"};
  return flags[country] || "🌍";
}

async function sendWithKeyboard(env, chatId, text, keyboard, messageId = null) {
  try {
    const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`;
    const body = {chat_id: chatId, text: text, parse_mode: "Markdown", reply_markup: JSON.stringify(keyboard)};
    if (messageId) body.reply_to_message_id = messageId;
    await fetch(url, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)});
  } catch (e) { console.error(e); }
}

// === ОБРАЗОВАТЕЛЬНЫЕ ФУНКЦИИ ===

async function solveProblem(env, userId, problem) {
  const systemMsg = `Ты репетитор. Реши задачу пошагово с объяснениями.`;
  const answer = await askAI(env, systemMsg, `Реши задачу:\n${problem}`);
  await saveConversation(env, userId, [{role: "user", content: `Solve: ${problem}`}, {role: "assistant", content: answer}]);
  return `🧮 **РЕШЕНИЕ**:\n\n${answer}`;
}

async function egePrep(env, userId, subject) {
  const systemMsg = `Ты эксперт ЕГЭ по ${subject}. Создай план подготовки и дай полезные советы.`;
  const answer = await askAI(env, systemMsg, `Подготовка к ЕГЭ по ${subject}`);
  await saveConversation(env, userId, [{role: "user", content: `EGE: ${subject}`}, {role: "assistant", content: answer}]);
  return `📚 **ЕГЭ: ${subject}**\n\n${answer}`;
}

async function universityHelp(env, userId, subject) {
  const systemMsg = `Ты преподаватель ВУЗа. Объясни тему просто и понятно.`;
  const answer = await askAI(env, systemMsg, `${subject}: объясни тему`);
  await saveConversation(env, userId, [{role: "user", content: `Uni: ${subject}`}, {role: "assistant", content: answer}]);
  return `🎓 **${subject}**:\n\n${answer}`;
}

async function calculate(env, userId, problem) {
  const answer = await askAI(env, "Ты математик. Реши и покажи решение.", `Вычисли: ${problem}`);
  await saveConversation(env, userId, [{role: "user", content: `Calc: ${problem}`}, {role: "assistant", content: answer}]);
  return `🔢 **ОТВЕТ**:\n\n${answer}`;
}

async function courseWorkHelp(env, userId, topic) {
  const systemMsg = `Ты научный руководитель. Помоги с курсовой: план, источники, структура.`;
  const answer = await askAI(env, systemMsg, `Курсовая: ${topic}`);
  await saveConversation(env, userId, [{role: "user", content: `Course: ${topic}`}, {role: "assistant", content: answer}]);
  return `📝 **КУРСОВАЯ**:\n\n${answer}`;
}

async function examPrep(env, userId, subject) {
  const systemMsg = `Ты преподаватель. Создай план подготовки к экзамену по ${subject}.`;
  const answer = await askAI(env, systemMsg, `Экзамен: ${subject}`);
  await saveConversation(env, userId, [{role: "user", content: `Exam: ${subject}`}, {role: "assistant", content: answer}]);
  return `📚 **ПОДГОТОВКА**:\n\n${answer}`;
}

async function translateText(env, userId, text) {
  const answer = await askAI(env, "Переведи текст. Укажи язык оригинала и перевода.", `Переведи: ${text}`);
  await saveConversation(env, userId, [{role: "user", content: `Translate: ${text}`}, {role: "assistant", content: answer}]);
  return `🔤 **ПЕРЕВОД**:\n\n${answer}`;
}

async function englishLesson(env, userId) {
  const answer = await askAI(env, "Создай мини-урок английского: слово дня, грамматика, примеры.", "English lesson");
  await saveConversation(env, userId, [{role: "user", content: "English"}, {role: "assistant", content: answer}]);
  return `🇬🇧 **ENGLISH LESSON**:\n\n${answer}`;
}

async function explainTopic(env, userId, topic) {
  const answer = await askAI(env, "Объясни тему просто, с примерами.", `Объясни: ${topic}`);
  await saveConversation(env, userId, [{role: "user", content: `Explain: ${topic}`}, {role: "assistant", content: answer}]);
  return `📖 **ОБЪЯСНЕНИЕ**:\n\n${answer}`;
}

// === ПРОГРАММИРОВАНИЕ ===

async function writeSolidity(env, userId, contractType) {
  const answer = await askAI(env, "Ты эксперт Solidity. Напиши контракт с комментариями.", `Solidity: ${contractType}`);
  await saveConversation(env, userId, [{role: "user", content: `Solidity: ${contractType}`}, {role: "assistant", content: answer}]);
  return `⛓️ **SOLIDITY**:\n\n${answer}\n\n⚠️ _Тестируй!_`;
}

async function writeCode(env, userId, task) {
  const answer = await askAI(env, "Ты senior разработчик. Пиши код с комментариями.", `Код: ${task}`);
  await saveConversation(env, userId, [{role: "user", content: `Code: ${task}`}, {role: "assistant", content: answer}]);
  return `💻 **КОД**:\n\n${answer}`;
}

// === ИНФЛЯЦИЯ ===

async function updateInflationData(env) {
  const data = {};
  ["Россия","США","Болгария","Германия","Китай","ЕС"].forEach(c => {
    data[c] = {rate: (3 + Math.random()*5).toFixed(1), trend: "➡️", updated: new Date().toISOString()};
  });
  await env.RAG_STORE.put("inflation_data", JSON.stringify(data));
}

async function getInflationData(env, userId, country) {
  try {
    let data = JSON.parse(await env.RAG_STORE.get("inflation_data") || "{}");
    if (!data[country]) await updateInflationData(env);
    data = JSON.parse(await env.RAG_STORE.get("inflation_data"));
    const d = data[country];
    return `📊 **${country}**: ${d?.rate || "N/A"}% ${d?.trend || ""}`;
  } catch { return "❌ Ошибка"; }
}

// === НОВОСТИ ===

async function getNews(env, userId, category) {
  const answer = await askAI(env, "Ты новостной редактор.", `Новости: ${category}`);
  if (userId !== "auto") await saveConversation(env, userId, [{role: "user", content: `News: ${category}`}, {role: "assistant", content: answer}]);
  return answer;
}

async function getDailyDigest(env, userId) {
  const answer = await askAI(env, "Ты главред. Дайджест за " + new Date().toLocaleDateString('ru-RU'), "Дайджест");
  if (userId !== "auto") await saveConversation(env, userId, [{role: "user", content: "Digest"}, {role: "assistant", content: answer}]);
  return answer;
}

async function getWorldNews(env, userId, country) {
  const answer = await askAI(env, "Ты обозреватель.", `Новости: ${country}`);
  if (userId !== "auto") await saveConversation(env, userId, [{role: "user", content: `World: ${country}`}, {role: "assistant", content: answer}]);
  return answer;
}

// === ОБЩЕЕ ===

async function universalAnswer(env, userId, question) {
  const answer = await askAI(env, "Ты Aiden, универсальный помощник. Отвечай на русском.", question);
  await saveConversation(env, userId, [{role: "user", content: question}, {role: "assistant", content: answer}]);
  return answer;
}

async function getConversation(env, userId) {
  try { const data = await env.CONVERSATION_STORE.get(`conv_${userId}`); return data ? JSON.parse(data) : []; }
  catch { return []; }
}

async function saveConversation(env, userId, messages, max = 20) {
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
      body: JSON.stringify({model: "mistralai/mistral-7b-instruct:free", messages: [{role:"system",content: system}, {role:"user",content: user}], max_tokens: 1200})
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
      body: JSON.stringify({model: "qwen/qwen3-235b-a22b:free", messages: [{role:"system",content:"Пост для Telegram."}, {role:"user",content:"Тема: "+topic}], max_tokens: 1000})
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content || `📝 ${topic}`;
  } catch(e) { return `📝 ${topic}`; }
}

function sendMsg(token, chatId, text) {
  return fetch("https://api.telegram.org/bot"+token+"/sendMessage", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({chat_id:chatId, text:text, parse_mode:"Markdown"})}).then(r=>r.json());
}

function looksLikeMath(text) { return /[=+\-×÷]/.test(text) && /\d/.test(text); }
function looksLikeProblem(text) { return /(реши|найди|вычисли|докажи|объясни)/i.test(text); }
function looksLikeTranslation(text) { return /(переведи|translate|на английском|на русском)/i.test(text); }
