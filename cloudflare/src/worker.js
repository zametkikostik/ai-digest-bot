/**
 * AI Digest Bot - SUPER FAST VERSION
 */
const CHANNEL_ID = "-1001859702206";
const ADMIN_IDS = ["1271633868"];

// Кэшированные данные
const INFLATION = {
  "Россия":"7.5% 📈","США":"3.2% 📉","Болгария":"4.8% ➡️",
  "Германия":"2.9% 📉","Китай":"2.1% ➡️","ЕС":"2.9% 📉"
};

const SUBJECTS = {
  "school_Математика":"🏫 **МАТЕМАТИКА**\n\nАлгебра, геометрия, тригонометрия.\n\nНапиши задачу!",
  "school_Физика":"🏫 **ФИЗИКА**\n\nМеханика, электричество, оптика.\n\nЗадай вопрос!",
  "school_Химия":"🏫 **ХИМИЯ**\n\nОрганическая, неорганическая.\n\nСпроси!",
  "uni_Высшая математика":"🎓 **ВЫШМАТ**\n\nИнтегралы, производные, ряды.\n\nЗадай задачу!",
  "uni_Программирование":"🎓 **ПРОГРАММИРОВАНИЕ**\n\nPython, JS, алгоритмы.\n\nЗадай вопрос!",
};

export default {
  async fetch(request, env) {
    if (request.method === "GET") return new Response("Bot OK");
    
    if (request.method === "POST") {
      const update = await request.json();
      
      // Кнопки — МГНОВЕННО
      if (update.callback_query) {
        const cb = update.callback_query;
        const data = cb.data;
        const chatId = cb.message.chat.id;
        const msgId = cb.message.message_id;
        
        let reply = "";
        let keyboard = null;
        
        if (data === "back_main" || data === "school_main" || data === "uni_main" || data === "code_main" || data === "economy_main" || data === "news_main") {
          reply = "🔙 Меню";
          keyboard = getMainKeyboard();
        } else if (SUBJECTS[data]) {
          reply = SUBJECTS[data];
          keyboard = getBackKeyboard();
        } else if (data.startsWith("inflation_")) {
          const country = data.replace("inflation_", "");
          reply = `📊 **${country}**: ${INFLATION[country] || "N/A"}`;
          keyboard = getBackKeyboard();
        } else if (data.startsWith("news_")) {
          reply = `📰 **НОВОСТИ**\n\nИспользуй /news`;
          keyboard = getBackKeyboard();
        }
        
        if (reply) await sendKB(env, chatId, reply, keyboard, msgId);
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
        
        if ((chatType === "group" || chatType === "supergroup") && !text.includes("@AidenHelpbot")) {
          return new Response("OK");
        }
        
        let reply = "";
        
        if (text === "/start") {
          reply = `👋 Привет, ${name}!\n\nЯ Aiden EDU.\n\nЖми кнопки! 👇`;
          await sendKB(env, chatId, reply, getMainKeyboard());
          return new Response("OK");
        }
        
        if (text === "/help") {
          reply = "📖 Жми кнопки или пиши:\n/solve, /code, /ask";
          await sendKB(env, chatId, reply, getHelpKB());
          return new Response("OK");
        }
        
        if (text.startsWith("/solve ")) {
          reply = await ai(env, "Реши: " + text.replace("/solve ", ""));
        } else if (text.startsWith("/code ")) {
          reply = await ai(env, "Код: " + text.replace("/code ", ""));
        } else if (text.startsWith("/ask ")) {
          reply = await ai(env, text.replace("/ask ", ""));
        } else if (text.startsWith("/inflation ")) {
          const c = text.replace("/inflation ", "");
          reply = `📊 **${c}**: ${INFLATION[c] || "N/A"}`;
        } else if (text === "/news") {
          reply = "📰 Используй /news Технологии";
        } else if (text.startsWith("/")) {
          reply = "❓ /help";
        } else {
          reply = await ai(env, text);
        }
        
        if (reply) await sendMsg(env.BOT_TOKEN, chatId, reply);
      }
      
      return new Response("OK");
    }
    
    return new Response("No");
  },
  
  async scheduled(event, env) {
    const h = new Date().getUTCHours();
    if (h === 12) await sendMsg(env.BOT_TOKEN, CHANNEL_ID, await ai(env, "Новости технологий"));
  }
};

// === КЛАВИАТУРЫ ===
function getMainKeyboard() {
  return {inline_keyboard: [
    [{text:"🏫 Школа",callback_data:"school_main"},{text:"🎓 ВУЗ",callback_data:"uni_main"}],
    [{text:"💻 Код",callback_data:"code_main"},{text:"📊 Инфляция",callback_data:"economy_main"}],
    [{text:"📰 Новости",callback_data:"news_main"},{text:"📖 Справка",callback_data:"help_main"}]
  ]};
}

function getBackKeyboard() {
  return {inline_keyboard: [[{text:"🔙 Назад",callback_data:"back_main"}]]};
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
      body: JSON.stringify({model: "mistralai/mistral-7b-instruct:free", messages: [{role:"user",content:text}], max_tokens: 800})
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "Не могу ответить";
  } catch(e) {
    return "Ошибка: " + e.message;
  }
}
