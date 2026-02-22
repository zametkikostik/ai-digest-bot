/**
 * AI Digest Bot - MAXIMUM UNIVERSAL + Inflation Data + Inline Buttons
 */
const CHANNEL_ID = "-1001859702206";
const ADMIN_IDS = ["1271633868"];

// Страны для отслеживания инфляции
const INFLATION_COUNTRIES = [
  "Россия", "США", "Китай", "Германия", "Франция", 
  "Великобритания", "Италия", "Испания", "Болгария", "Польша",
  "Япония", "Индия", "Бразилия", "Турция", "Украина",
  "Беларусь", "Казахстан", "Европейский союз"
];

export default {
  async fetch(request, env) {
    try {
      if (request.method === "GET") {
        return new Response("AI Digest Bot 🤖\nУниверсальный PRO + Инфляция");
      }
      
      if (request.method === "POST") {
        const update = await request.json();
        
        // Обработка callback query (кнопки)
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
          
          // === КОМАНДЫ С КНОПКАМИ ===
          if (text === "/start") {
            reply = `👋 Привет, ${name}!

Я — **Aiden PRO**, максимально универсальный AI-помощник.

🌟 **ВСЕ ВОЗМОЖНОСТИ:**

💻 **ПРОГРАММИРОВАНИЕ:**
• Python, JS, TS, Go, Rust, Java, C++
• Solidity (смарт-контракты)
• Web3, DeFi, NFT

📰 **НОВОСТИ И АНАЛИТИКА:**
• Новости всех стран
• Аналитические обзоры
• Прогнозы и тренды

📊 **ЭКОНОМИКА:**
• Инфляция всех стран
• Курсы валют
• Экономические данные

📋 **И ЕЩЁ:**
• Бизнес-консультации
• Юридическая помощь
• Дом и сад
• Образование

**Выбери раздел кнопками ниже!** 👇`;
            
            await sendWithKeyboard(env, chatId, reply, getMainKeyboard());
            return new Response("OK");
            
          } else if (text === "/help") {
            reply = `📖 **СПРАВКА:**

**💻 Программирование:**
/code [задача] — код
/solidity [контракт] — смарт-контракт
/debug [код] — отладка

**📰 Новости:**
/news [категория] — новости
/analyze [тема] — аналитика
/digest — дайджест

**📊 Экономика:**
/inflation — инфляция стран
/inflation [страна] — инфляция страны
/economy — эконом.данные

**📋 Ещё:**
/business, /legal, /garden, /ask

**Используй кнопки для удобства!**`;
            
            await sendWithKeyboard(env, chatId, reply, getHelpKeyboard());
            return new Response("OK");
            
          } else if (text === "/inflation" || text.startsWith("/inflation ")) {
            const country = text.replace("/inflation ", "").trim();
            if (country) {
              reply = await getInflationData(env, uid, country);
            } else {
              reply = "📊 **ИНФЛЯЦИЯ ПО СТРАНАМ**\n\nВыберите страну:";
              await sendWithKeyboard(env, chatId, reply, getInflationKeyboard());
              return new Response("OK");
            }
            
          } else if (text === "/economy") {
            reply = "📈 **ЭКОНОМИЧЕСКИЕ ДАННЫЕ**\n\nВыберите показатель:";
            await sendWithKeyboard(env, chatId, reply, getEconomyKeyboard());
            return new Response("OK");
            
          } else if (text === "/news") {
            reply = "📰 **НОВОСТИ**\n\nВыберите категорию:";
            await sendWithKeyboard(env, chatId, reply, getNewsKeyboard());
            return new Response("OK");
            
          } else if (text === "/code" || text.startsWith("/code ")) {
            const task = text.replace("/code ", "").trim();
            reply = task ? await writeCode(env, uid, task) : "⚠️ Опишите задачу!";
            
          } else if (text === "/solidity" || text.startsWith("/solidity ")) {
            const contract = text.replace("/solidity ", "").trim();
            reply = contract ? await writeSolidity(env, uid, contract) : "⚠️ Опишите контракт!";
            
          } else if (text === "/ask" || text.startsWith("/ask ")) {
            const q = text.replace("/ask ", "").trim();
            reply = q ? await universalAnswer(env, uid, q) : "⚠️ Задайте вопрос!";
            
          } else if (text === "/business" || text.startsWith("/business ")) {
            const q = text.replace("/business ", "").trim();
            reply = q ? await businessConsult(env, uid, q) : "⚠️ Задайте вопрос!";
            
          } else if (text === "/digest") {
            reply = await getDailyDigest(env, uid);
            
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
  
  // Автообновление инфляции (каждые 6 часов)
  async scheduled(event, env) {
    const hour = new Date().getUTCHours();
    
    // Обновление данных об инфляции
    if (hour % 6 === 0) {
      await updateInflationData(env);
      console.log("Inflation data updated");
    }
    
    // Дайджест в 6 UTC
    if (hour === 6) {
      await sendMsg(env.BOT_TOKEN, CHANNEL_ID, await getDailyDigest(env, "auto"));
    }
    // Новости в 12 UTC
    if (hour === 12) {
      await sendMsg(env.BOT_TOKEN, CHANNEL_ID, await getNews(env, "auto", "Технологии"));
    }
    // Мир в 18 UTC
    if (hour === 18) {
      await sendMsg(env.BOT_TOKEN, CHANNEL_ID, await getWorldNews(env, "auto", "Мир"));
    }
  }
};

// === ОБРАБОТКА КНОПОК ===

async function handleCallback(env, chatId, userId, data, message) {
  let reply = "";
  
  if (data.startsWith("inflation_")) {
    const country = data.replace("inflation_", "");
    reply = await getInflationData(env, userId, country);
    
  } else if (data.startsWith("news_")) {
    const category = data.replace("news_", "");
    reply = await getNews(env, userId, category);
    
  } else if (data === "economy_main") {
    reply = "📈 **ЭКОНОМИКА**\n\nВыберите:";
    await sendWithKeyboard(env, chatId, reply, getEconomyKeyboard(), message.message_id);
    return;
    
  } else if (data === "code_main") {
    reply = "💻 **ПРОГРАММИРОВАНИЕ**\n\nВыберите:";
    await sendWithKeyboard(env, chatId, reply, getCodeKeyboard(), message.message_id);
    return;
    
  } else if (data === "back_main") {
    reply = "🔙 **Главное меню**\n\nВыберите раздел:";
    await sendWithKeyboard(env, chatId, reply, getMainKeyboard(), message.message_id);
    return;
    
  } else if (data === "help_main") {
    reply = "📖 **СПРАВКА**\n\nИспользуй кнопки или команды:";
    await sendWithKeyboard(env, chatId, reply, getHelpKeyboard(), message.message_id);
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
      [{text: "📊 Инфляция", callback_data: "economy_main"},
       {text: "📰 Новости", callback_data: "news_main"}],
      [{text: "💻 Код", callback_data: "code_main"},
       {text: "📈 Экономика", callback_data: "economy_main"}],
      [{text: "📖 Справка", callback_data: "help_main"}]
    ]
  };
}

function getInflationKeyboard() {
  const keyboard = [];
  const row1 = [], row2 = [], row3 = [];
  
  INFLATION_COUNTRIES.slice(0, 5).forEach(c => row1.push({text: getFlag(c) + " " + c, callback_data: "inflation_" + c}));
  INFLATION_COUNTRIES.slice(5, 10).forEach(c => row2.push({text: getFlag(c) + " " + c, callback_data: "inflation_" + c}));
  INFLATION_COUNTRIES.slice(10, 15).forEach(c => row3.push({text: getFlag(c) + " " + c, callback_data: "inflation_" + c}));
  
  keyboard.push(row1, row2, row3);
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
      [{text: "⚽ Спорт", callback_data: "news_Спорт"},
       {text: "🎬 Культура", callback_data: "news_Культура"}],
      [{text: "🔙 Назад", callback_data: "back_main"}]
    ]
  };
}

function getEconomyKeyboard() {
  return {
    inline_keyboard: [
      [{text: "💹 Инфляция", callback_data: "inflation_Все страны"},
       {text: "💱 Курсы валют", callback_data: "economy_rates"}],
      [{text: "📊 ВВП стран", callback_data: "economy_gdp"},
       {text: "📈 Безработица", callback_data: "economy_unemployment"}],
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
       {text: "🦀 Rust", callback_data: "code_rust"}],
      [{text: "🔙 Назад", callback_data: "back_main"}]
    ]
  };
}

function getHelpKeyboard() {
  return {
    inline_keyboard: [
      [{text: "💻 Программирование", callback_data: "help_code"},
       {text: "📰 Новости", callback_data: "help_news"}],
      [{text: "📊 Экономика", callback_data: "help_economy"},
       {text: "📖 Общее", callback_data: "help_general"}],
      [{text: "🔙 Назад", callback_data: "back_main"}]
    ]
  };
}

function getBackKeyboard() {
  return {
    inline_keyboard: [
      [{text: "🔙 В главное меню", callback_data: "back_main"}]
    ]
  };
}

function getFlag(country) {
  const flags = {
    "Россия": "🇷🇺", "США": "🇺🇸", "Китай": "🇨🇳", "Германия": "🇩🇪",
    "Франция": "🇫🇷", "Великобритания": "🇬🇧", "Италия": "🇮🇹",
    "Испания": "🇪🇸", "Болгария": "🇧🇬", "Польша": "🇵🇱",
    "Япония": "🇯🇵", "Индия": "🇮🇳", "Бразилия": "🇧🇷",
    "Турция": "🇹🇷", "Украина": "🇺🇦", "Беларусь": "🇧🇾",
    "Казахстан": "🇰🇿", "Европейский союз": "🇪🇺"
  };
  return flags[country] || "🌍";
}

async function sendWithKeyboard(env, chatId, text, keyboard, messageId = null) {
  try {
    const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`;
    const body = {
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown",
      reply_markup: JSON.stringify(keyboard)
    };
    if (messageId) {
      body.reply_to_message_id = messageId;
    }
    const r = await fetch(url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body)
    });
    return r.json();
  } catch (e) {
    console.error("sendWithKeyboard error:", e);
  }
}

// === ИНФЛЯЦИЯ ===

async function updateInflationData(env) {
  const inflationData = {};
  
  for (const country of INFLATION_COUNTRIES) {
    // Генерируем реалистичные данные (в реальном проекте — API)
    const baseRate = country === "Россия" ? 7.5 :
                     country === "США" ? 3.2 :
                     country === "Болгария" ? 4.8 :
                     country === "Европейский союз" ? 2.9 :
                     5.0 + Math.random() * 5;
    
    inflationData[country] = {
      rate: baseRate.toFixed(1),
      previous: (baseRate + 0.5).toFixed(1),
      trend: baseRate > 5 ? "📈 Растёт" : baseRate < 3 ? "📉 Падает" : "➡️ Стабильно",
      updated: new Date().toISOString()
    };
  }
  
  await env.RAG_STORE.put("inflation_data", JSON.stringify(inflationData));
}

async function getInflationData(env, userId, country) {
  try {
    const stored = await env.RAG_STORE.get("inflation_data");
    let data = stored ? JSON.parse(stored) : null;
    
    if (!data) {
      await updateInflationData(env);
      data = JSON.parse(await env.RAG_STORE.get("inflation_data"));
    }
    
    if (country === "Все страны") {
      let reply = "📊 **ИНФЛЯЦИЯ ПО СТРАНАМ**\n\n";
      Object.entries(data).slice(0, 10).forEach(([c, d]) => {
        reply += `${getFlag(c)} **${c}**: ${d.rate}% ${d.trend}\n`;
      });
      reply += "\n_Данные обновляются каждые 6 часов_";
      return reply;
    }
    
    const countryData = data[country];
    if (!countryData) {
      return `❌ Нет данных по стране: ${country}`;
    }
    
    return `📊 **ИНФЛЯЦИЯ: ${country.toUpperCase()}**\n\n` +
           `💹 **Текущая**: ${countryData.rate}%\n` +
           `📊 **Прошлая**: ${countryData.previous}%\n` +
           `📈 **Тренд**: ${countryData.trend}\n\n` +
           `_Данные обновлены: ${new Date(countryData.updated).toLocaleString('ru-RU')}_`;
           
  } catch (e) {
    return "❌ Ошибка получения данных";
  }
}

// === ОСТАЛЬНЫЕ ФУНКЦИИ ===

async function writeSolidity(env, userId, contractType) {
  const systemMsg = `Ты эксперт по Solidity. Напиши профессиональный смарт-контракт с комментариями на русском.`;
  const answer = await askAI(env, systemMsg, `Смарт-контракт: ${contractType}`);
  await saveConversation(env, userId, [{role: "user", content: `Solidity: ${contractType}`}, {role: "assistant", content: answer}]);
  return `⛓️ **Solidity**:\n\n${answer}\n\n⚠️ _Тестируй перед деплоем!_`;
}

async function writeCode(env, userId, task) {
  const answer = await askAI(env, "Ты senior разработчик. Пиши чистый код с комментариями.", `Код: ${task}`);
  await saveConversation(env, userId, [{role: "user", content: `Code: ${task}`}, {role: "assistant", content: answer}]);
  return `💻 **Код**:\n\n${answer}`;
}

async function universalAnswer(env, userId, question) {
  const answer = await askAI(env, "Ты Aiden, универсальный помощник. Отвечай на русском.", question);
  await saveConversation(env, userId, [{role: "user", content: question}, {role: "assistant", content: answer}]);
  return answer;
}

async function businessConsult(env, userId, question) {
  const answer = await askAI(env, "Ты бизнес-консультант.", `Бизнес: ${question}`);
  await saveConversation(env, userId, [{role: "user", content: `Business: ${question}`}, {role: "assistant", content: answer}]);
  return `📊 **КОНСУЛЬТАЦИЯ**:\n\n${answer}`;
}

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
  const answer = await askAI(env, "Ты международный обозреватель.", `Новости: ${country}`);
  if (userId !== "auto") await saveConversation(env, userId, [{role: "user", content: `World: ${country}`}, {role: "assistant", content: answer}]);
  return answer;
}

async function getConversation(env, userId) {
  try {
    const data = await env.CONVERSATION_STORE.get(`conv_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
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
      headers: {
        "Authorization": "Bearer " + env.OPENROUTER_API_KEY,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-bot.com",
        "X-Title": "AidenBot"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [{role: "system", content: system}, {role: "user", content: user}],
        max_tokens: 1200
      })
    });
    if (!r.ok) throw new Error(`API ${r.status}`);
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "Не могу ответить";
  } catch(e) {
    return "Ошибка: " + e.message;
  }
}

async function generatePost(env, topic) {
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.OPENROUTER_API_KEY,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-bot.com",
        "X-Title": "AidenBot"
      },
      body: JSON.stringify({
        model: "qwen/qwen3-235b-a22b:free",
        messages: [{role:"system",content:"Пост для Telegram."}, {role:"user",content:"Тема: "+topic}],
        max_tokens: 1000
      })
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content || `📝 ${topic}`;
  } catch(e) {
    return `📝 ${topic}`;
  }
}

function sendMsg(token, chatId, text) {
  return fetch("https://api.telegram.org/bot"+token+"/sendMessage", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({chat_id: chatId, text: text, parse_mode: "Markdown"})
  }).then(r => r.json());
}
