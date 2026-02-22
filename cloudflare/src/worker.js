/**
 * AI Digest Bot - Minimal Working Version
 */
const CHANNEL_ID = "-1001859702206";
const ADMIN_IDS = ["1271633868"];

export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      return new Response("Bot running! 🤖");
    }
    if (request.method === "POST") {
      const update = await request.json();
      if (update.message) {
        const msg = update.message;
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const name = msg.from?.first_name || "User";
        const uid = msg.from?.id?.toString();
        
        // Обработка команд
        let reply = "";
        if (text === "/start") {
          reply = `👋 Привет, ${name}!\n\nЯ AI-бот. Спроси меня о чём угодно!`;
        } else if (text === "/help") {
          reply = "📖 Напиши любой вопрос — я отвечу!";
        } else if (text.startsWith("/post ") && ADMIN_IDS.includes(uid)) {
          const topic = text.replace("/post ", "");
          const post = await generatePost(env, topic);
          const res = await sendMsg(env.BOT_TOKEN, CHANNEL_ID, post);
          reply = res.ok ? "✅ Опубликовано!" : "❌ " + (res.description || "Ошибка");
        } else if (text.startsWith("/")) {
          reply = "❓ Неизвестная команда";
        } else {
          reply = await askAI(env, text);
        }
        
        if (reply) await sendMsg(env.BOT_TOKEN, chatId, reply);
      }
      return new Response("OK");
    }
    return new Response("No");
  }
};

async function askAI(env, q) {
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          {role:"system",content:"Отвечай кратко на русском."},
          {role:"user",content:q}
        ],
        max_tokens: 500
      })
    });
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
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen/qwen3-235b-a22b:free",
        messages: [
          {role:"system",content:"Создай пост для Telegram. Заголовок с эмодзи, текст, 3-5 хэштегов."},
          {role:"user",content:"Тема: "+topic}
        ],
        max_tokens: 1000
      })
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "📝 Пост: "+topic;
  } catch(e) {
    return "📝 "+topic;
  }
}

function sendMsg(token, chatId, text) {
  return fetch("https://api.telegram.org/bot"+token+"/sendMessage", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({chat_id: chatId, text: text, parse_mode: "Markdown"})
  }).then(r => r.json());
}
