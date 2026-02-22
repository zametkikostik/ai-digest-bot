/**
 * AI Digest Bot - Простая версия для теста
 */

const CHANNEL_ID = "-1001859702206";
const ADMIN_IDS = ["1271633868"];

export default {
  async fetch(request, env, ctx) {
    if (request.method === "GET") {
      return new Response("AI Digest Bot is running! 🤖", {
        headers: { "Content-Type": "text/plain" }
      });
    }

    if (request.method === "POST") {
      try {
        const update = await request.json();
        
        if (update.message) {
          const message = update.message;
          const chatId = message.chat.id;
          const text = message.text || "";
          const firstName = message.from?.first_name || "User";
          const userId = message.from?.id?.toString();
          const chatType = message.chat.type;
          
          console.log(`[${chatType}] ${firstName}: ${text}`);
          
          // Модерация в группах
          if (chatType === "group" || chatType === "supergroup") {
            if (!ADMIN_IDS.includes(userId) && text.length > 0) {
              // Простая модерация ссылок
              if (text.includes("http://") || text.includes("https://")) {
                await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/deleteMessage`, {
                  method: "POST",
                  body: JSON.stringify({ chat_id: chatId, message_id: message.message_id })
                });
                await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
                  method: "POST",
                  body: JSON.stringify({ chat_id: chatId, text: `⚠️ ${firstName}, ссылки запрещены!` })
                });
              }
            }
            return new Response("OK", { status: 200 });
          }
          
          // Личный чат
          if (chatType === "private") {
            let response = "";
            
            if (text === "/start") {
              response = `👋 Привет, ${firstName}!

Я — AI-дайджест бот.

📋 Команды:
• /help — справка
• /ask [вопрос] — вопрос AI
• /post [тема] — пост в канал (admin)

💡 Напиши любой вопрос — отвечу!`;
            } else if (text === "/help") {
              response = `📖 Справка:

/start — приветствие
/ask [вопрос] — задать вопрос AI
/post [тема] — пост в канал (admin)

Просто напиши вопрос — я отвечу!`;
            } else if (text.startsWith("/ask ")) {
              const question = text.replace("/ask ", "");
              const answer = await askAI(env, question);
              response = `🤖 Ответ:\n\n${answer}`;
            } else if (text.startsWith("/post ") && ADMIN_IDS.includes(userId)) {
              const topic = text.replace("/post ", "");
              const post = await generatePost(env, topic);
              const result = await sendToChannel(env, post);
              response = result.ok ? "✅ Опубликовано!" : `❌ Ошибка: ${result.description}`;
            } else if (text.startsWith("/")) {
              response = "❓ Неизвестная команда. Используйте /help";
            } else {
              // Обычный вопрос
              const answer = await askAI(env, text);
              response = `🤖 ${answer}`;
            }
            
            if (response) {
              await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: response,
                  parse_mode: "Markdown"
                })
              });
            }
          }
        }
        
        return new Response("OK", { status: 200 });
        
      } catch (error) {
        console.error("Error:", error);
        return new Response(`Error: ${error.message}`, { status: 500 });
      }
    }

    return new Response("Method not allowed", { status: 405 });
  },
  
  // Cron для автопостинга
  async scheduled(event, env, ctx) {
    const topics = [
      "Новости ИИ за неделю",
      "Новые AI инструменты",
      "Как нейросети меняют мир",
      "Обзор GPT-4 vs Claude",
      "AI для разработчиков"
    ];
    
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const post = await generatePost(env, topic);
    await sendToChannel(env, post);
    console.log(`Posted: ${topic}`);
  }
};

async function askAI(env, question) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          { role: "system", content: "Ты AI-помощник. Отвечай кратко на русском." },
          { role: "user", content: question }
        ],
        max_tokens: 500
      })
    });
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Не могу ответить сейчас";
  } catch {
    return "Ошибка подключения к AI";
  }
}

async function generatePost(env, topic) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen/qwen3-235b-a22b:free",
        messages: [
          { role: "system", content: "Создай пост для Telegram канала про ИИ. Формат: заголовок с эмодзи, текст 500-800 символов, 3-5 хэштегов, призыв к действию." },
          { role: "user", content: `Тема: ${topic}` }
        ],
        max_tokens: 1000
      })
    });
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || `Пост на тему: ${topic}`;
  } catch {
    return `📝 Пост на тему: ${topic}\n\n#AI #News`;
  }
}

async function sendToChannel(env, text) {
  return fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: "-1001859702206",
      text: text,
      parse_mode: "Markdown"
    })
  }).then(r => r.json());
}
