/**
 * AI Digest Bot - Super Simple Version
 */
const CHANNEL_ID = "-1001859702206";
const ADMIN_IDS = ["1271633868"];

export default {
  async fetch(request, env) {
    try {
      if (request.method === "GET") {
        return new Response("Bot OK! 🤖");
      }
      
      if (request.method === "POST") {
        const update = await request.json();
        console.log("Update:", JSON.stringify(update));
        
        if (update.message) {
          const msg = update.message;
          const chatId = msg.chat.id;
          const text = msg.text || "";
          const name = msg.from?.first_name || "User";
          const uid = msg.from?.id?.toString();
          
          console.log(`Message: ${text} from ${name}`);
          
          let reply = "";
          
          if (text === "/start") {
            reply = `👋 Привет, ${name}! Я работаю!`;
          } else if (text === "/help") {
            reply = "📖 Я AI бот. Спроси что-нибудь!";
          } else if (text === "/test") {
            reply = "✅ Бот работает! Секреты: BOT_TOKEN=" + (env.BOT_TOKEN ? "OK" : "MISSING") + ", OPENROUTER=" + (env.OPENROUTER_API_KEY ? "OK" : "MISSING");
          } else if (text.startsWith("/post ") && ADMIN_IDS.includes(uid)) {
            reply = "📝 Пост отправлен в канал!";
          } else if (text.startsWith("/")) {
            reply = "❓ Команда: " + text;
          } else {
            reply = `💬 Вы написали: "${text}". Я пока учусь отвечать!`;
          }
          
          if (reply) {
            const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`;
            const resp = await fetch(url, {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({
                chat_id: chatId,
                text: reply
              })
            });
            const result = await resp.json();
            console.log("Send result:", JSON.stringify(result));
          }
        }
        
        return new Response("OK");
      }
      
      return new Response("No");
      
    } catch (e) {
      console.error("Error:", e);
      return new Response("Error: " + e.message, {status: 500});
    }
  }
};
