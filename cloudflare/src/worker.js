/**
 * Простой Telegram Bot Worker для Cloudflare Workers
 * Тестовая версия
 */

export default {
  async fetch(request, env, ctx) {
    // Health check
    if (request.method === "GET") {
      return new Response("AI Digest Bot is running! 🤖", {
        headers: { "Content-Type": "text/plain" }
      });
    }

    // Webhook от Telegram
    if (request.method === "POST") {
      try {
        const update = await request.json();
        
        // Проверяем что есть сообщение
        if (update.message) {
          const message = update.message;
          const chatId = message.chat.id;
          const text = message.text || "";
          const firstName = message.from.first_name || "User";

          console.log(`Message from ${firstName}: ${text}`);

          // Обработка команд
          let responseText = "";

          if (text === "/start") {
            responseText = `👋 Привет, ${firstName}!

Я — AI-дайджест, твой помощник по миру ИИ.

Команды:
• /help — справка
• /ask [вопрос] — вопрос AI
• /rules — правила

Просто напиши мне, и я отвечу!`;
          } else if (text === "/help") {
            responseText = `📖 **Справка**:

/start — приветствие
/help — эта справка
/ask [вопрос] — задать вопрос AI
/search [запрос] — поиск в базе
/rules — правила чата

Для админов:
/generate [тема] — создать пост`;
          } else if (text === "/rules") {
            responseText = `📜 **Правила**:

1. Уважайте участников
2. Без спама и рекламы
3. Без оскорблений
4. Без NSFW
5. Без персональных данных`;
          } else {
            responseText = `🤖 Я получил ваше сообщение:

"${text}"

Скоро я научусь отвечать на вопросы!`;
          }

          // Отправляем ответ
          await sendMessage(env.BOT_TOKEN, chatId, responseText);
        }

        return new Response("OK", { status: 200 });

      } catch (error) {
        console.error("Error:", error);
        return new Response(`Error: ${error.message}`, { status: 500 });
      }
    }

    return new Response("Method not allowed", { status: 405 });
  }
};

// Функция отправки сообщений
async function sendMessage(token, chatId, text) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown"
    })
  });
}
