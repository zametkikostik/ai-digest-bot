/**
 * Aiden PRO Bot - Cloudflare Workers (Optimized for Free Plan)
 * Кэширование котировок для экономии лимитов
 */

const BOT_TOKEN = "8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc";
const CACHE_TTL = 300; // 5 минут кэш

// Кэш в памяти (сбрасывается после каждого запроса)
let cryptoCache = null;
let moexCache = null;
let cryptoTime = 0;
let moexTime = 0;

// Получение криптовалют с кэшем
async function getCryptoPrices(env) {
  const now = Date.now();
  
  // Проверка кэша
  if (cryptoCache && (now - cryptoTime) < CACHE_TTL * 1000) {
    return cryptoCache;
  }
  
  // Проверка KV кэша
  if (env.RAG_STORE) {
    const cached = await env.RAG_STORE.get('crypto_prices');
    if (cached) {
      cryptoCache = JSON.parse(cached);
      cryptoTime = now;
      return cryptoCache;
    }
  }
  
  // Запрос к API
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,cardano,ripple&vs_currencies=usd&include_24hr_change=true');
    const d = await r.json();
    cryptoCache = {
      btc: {p:d.bitcoin.usd,c:d.bitcoin.usd_24h_change?.toFixed(2)},
      eth: {p:d.ethereum.usd,c:d.ethereum.usd_24h_change?.toFixed(2)},
      sol: {p:d.solana.usd,c:d.solana.usd_24h_change?.toFixed(2)},
      bnb: {p:d.binancecoin.usd,c:d.binancecoin.usd_24h_change?.toFixed(2)},
      ada: {p:d.cardano.usd,c:d.cardano.usd_24h_change?.toFixed(2)},
      xrp: {p:d.ripple.usd,c:d.ripple.usd_24h_change?.toFixed(2)}
    };
    cryptoTime = now;
    
    // Сохранение в KV
    if (env.RAG_STORE) {
      await env.RAG_STORE.put('crypto_prices', JSON.stringify(cryptoCache), {expirationTtl: CACHE_TTL});
    }
    
    return cryptoCache;
  } catch(e) { 
    console.error("Crypto API error:", e);
    return null; 
  }
}

// Получение MOEX с кэшем
async function getMoexPrices(env) {
  const now = Date.now();
  
  if (moexCache && (now - moexTime) < CACHE_TTL * 1000) {
    return moexCache;
  }
  
  if (env.RAG_STORE) {
    const cached = await env.RAG_STORE.get('moex_prices');
    if (cached) {
      moexCache = JSON.parse(cached);
      moexTime = now;
      return moexCache;
    }
  }
  
  try {
    const r = await fetch('https://www.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?s=sber,gazp,lkoh,tatn,polvb,yndxsban');
    const d = await r.json();
    const s = {};
    if(d&&d.securities&&d.marketdata){
      const m=new Map(d.securities.data.map(x=>[x[0],x[1]]));
      const v=new Map(d.marketdata.data.map(x=>[x[0],x]));
      for(const[c,n]of m){const x=v.get(c);if(x)s[c.toLowerCase()]={n,p:x[11]||0,c:x[12]||0,cp:x[13]||0};}
    }
    moexCache = s;
    moexTime = now;
    
    if (env.RAG_STORE) {
      await env.RAG_STORE.put('moex_prices', JSON.stringify(moexCache), {expirationTtl: CACHE_TTL});
    }
    
    return s;
  } catch(e) { 
    console.error("MOEX API error:", e);
    return null; 
  }
}

const MAIN_KB={inline_keyboard:[
  [{text:"🏫 Школа",callback_data:"school_main"},{text:"🎓 ВУЗ",callback_data:"uni_main"}],
  [{text:"🌿 Сад",callback_data:"garden_main"},{text:"🎓 AI",callback_data:"tutor_main"}],
  [{text:"💰 Инвест",callback_data:"invest_main"},{text:"₿ Крипта",callback_data:"crypto_main"}],
  [{text:"🌤️ Погода",callback_data:"weather_main"},{text:"📊 Инфляция",callback_data:"inflation_main"}],
  [{text:"⚖️ Юрист",callback_data:"lawyer_main"},{text:"🗣️ Языки",callback_data:"lang_main"}]
]};

async function msg(id,text,kb){
  const b={chat_id:id,text,parse_mode:"Markdown"};
  if(kb)b.reply_markup=JSON.stringify(kb);
  try{const r=await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)});return await r.json();}catch(e){return null;}
}

async function answerCb(id,t){try{await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({callback_query_id:id,text:t,show_alert:!!t})});}catch(e){}}

async function handleCmd(m,env){
  const id=m.chat.id,t=m.text,n=m.from?.first_name||"User";
  if(t==="/start")return msg(id,`👋 Привет,*${n}*!\n\n🤖*Aiden PRO*—твой помощник!\n\n📚*Разделы:*\n• 🏫 Школа/ВУЗ • 🌿 Сад\n• 🎓 AI • 💰 Инвест\n• ₿ Крипта • 🌤️ Погода\n• ⚖️ Юрист • 🗣️ Языки\n\n👇Жми кнопки!`,MAIN_KB);
  if(t==="/help")return msg(id,"📖*СПРАВКА*\n\n/start—Меню\n/help—Справка\n\n✅Admin:бесплатно!",{inline_keyboard:[[{text:"📚 Категории",callback_data:"categories"}],[{text:"🔙 Назад",callback_data:"back"}]]});
  if(t==="/categories")return msg(id,"📚*Категории:*\n\nВыберите:",MAIN_KB);
  if(t==="/crypto"){
    const c=await getCryptoPrices(env);
    if(c){const f=x=>`$${x.p.toLocaleString()}(${x.c>=0?'📈':'📉'}${x.c}%)`;
      return msg(id,`₿*КРИПТА*\n\nBTC:${f(c.btc)}\nETH:${f(c.eth)}\nSOL:${f(c.sol)}\nBNB:${f(c.bnb)}\n\n_Кэш: 5 мин_`,{inline_keyboard:[[{text:"🔄Обновить",callback_data:"crypto_refresh"}],[{text:"🔙Назад",callback_data:"back"}]]});}
    return msg(id,"₿*Крипта*\n\nЗагрузка...");
  }
  if(t==="/invest"){
    const m=await getMoexPrices(env);
    if(m&&m.sber){const f=x=>`${x.p}₽(${x.cp>=0?'📈':'📉'}${x.cp}%)`;
      return msg(id,`💰*АКЦИИ MOEX*\n\nСБЕР:${f(m.sber)}\nГАЗП:${f(m.gazp)}\nЛУКОЙ:${f(m.lkoh)}\n\n_Кэш: 5 мин_`,{inline_keyboard:[[{text:"🔄Обновить",callback_data:"moex_refresh"}],[{text:"🔙Назад",callback_data:"back"}]]});}
    return msg(id,"💰*Инвест*\n\nЗагрузка...");
  }
  return null;
}

async function handleCb(cb,env){
  const id=cb.message.chat.id,d=cb.data;let r="",k=null;
  await answerCb(cb.id);
  if(d==="back"||d==="categories"){r=d==="back"?"🔙*Меню*":"📚*Категории*";k=MAIN_KB;}
  else if(d==="invest_main"){r="💰*ИНВЕСТ*";k={inline_keyboard:[[{text:"📈Акции",callback_data:"invest_stocks"}],[{text:"🔙Назад",callback_data:"back"}]]};}
  else if(d==="invest_stocks"){const m=await getMoexPrices(env);if(m&&m.sber){const f=x=>`${x.p}₽(${x.cp>=0?'📈':'📉'}${x.cp}%)`;r=`💰*АКЦИИ*\n\nСБЕР:${f(m.sber)}\nГАЗП:${f(m.gazp)}\nЛУКОЙ:${f(m.lkoh)}`;k={inline_keyboard:[[{text:"🔄Обновить",callback_data:"moex_refresh"}],[{text:"🔙Назад",callback_data:"back"}]]};}else{r="Загрузка...";k={inline_keyboard:[[{text:"🔄Обновить",callback_data:"moex_refresh"}],[{text:"🔙Назад",callback_data:"back"}]]};}}
  else if(d==="moex_refresh"){await answerCb(cb.id,"Обновляю...");const m=await getMoexPrices(env);if(m&&m.sber){const f=x=>`${x.p}₽(${x.cp>=0?'📈':'📉'}${x.cp}%)`;r=`💰*MOEX*\n\nСБЕР:${f(m.sber)}\nГАЗП:${f(m.gazp)}\n\n_Обновлено:_${new Date().toLocaleTimeString('ru-RU')}`;k={inline_keyboard:[[{text:"🔄Обновить",callback_data:"moex_refresh"}],[{text:"🔙Назад",callback_data:"back"}]]};}}
  else if(d==="crypto_main"){r="₿*КРИПТА*";k={inline_keyboard:[[{text:"BTC",callback_data:"crypto_btc"}],[{text:"🔙Назад",callback_data:"back"}]]};}
  else if(d==="crypto_refresh"){await answerCb(cb.id,"Обновляю...");const c=await getCryptoPrices(env);if(c){const f=x=>`$${x.p.toLocaleString()}(${x.c>=0?'📈':'📉'}${x.c}%)`;r=`₿*КРИПТА*\n\nBTC:${f(c.btc)}\nETH:${f(c.eth)}\n\n_Обновлено:_${new Date().toLocaleTimeString('ru-RU')}`;k={inline_keyboard:[[{text:"🔄Обновить",callback_data:"crypto_refresh"}],[{text:"🔙Назад",callback_data:"back"}]]};}}
  else if(d==="crypto_btc"){const c=await getCryptoPrices(env);if(c){r=`₿*BTC*\n\n$${c.btc.p.toLocaleString()}(${c.btc.c>=0?'📈':'📉'}${c.btc.c}%)`;k={inline_keyboard:[[{text:"🔙Назад",callback_data:"crypto_main"}]]};}}
  else if(d.startsWith("school_")||d.startsWith("uni_")||d.startsWith("garden_")||d.startsWith("tutor_")){r=`${d.toUpperCase()}`;k={inline_keyboard:[[{text:"🔙Назад",callback_data:"back"}]]};}
  else if(d==="lawyer_main"){r="⚖️*ЮРИСТ*";k={inline_keyboard:[[{text:"🇷🇺РФ",callback_data:"lawyer_ru"}],[{text:"🇧🇬BG",callback_data:"lawyer_bg"}],[{text:"🔙Назад",callback_data:"back"}]]};}
  else if(d==="lawyer_ru"){r="⚖️*ЮРИСТ РФ*\n\nГК,УК,ТК";k={inline_keyboard:[[{text:"🔙Назад",callback_data:"lawyer_main"}]]};}
  else if(d==="lawyer_bg"){r="⚖️*ЮРИСТ BG*\n\nЗЗД,НК,КТ";k={inline_keyboard:[[{text:"🔙Назад",callback_data:"lawyer_main"}]]};}
  else if(d==="lang_main"){r="🗣️*ЯЗЫКИ*";k={inline_keyboard:[[{text:"🇬🇧EN",callback_data:"lang_en"}],[{text:"🇧🇬BG",callback_data:"lang_bg"}],[{text:"🔙Назад",callback_data:"back"}]]};}
  else if(d.startsWith("lang_")){r=`${d.toUpperCase()}`;k={inline_keyboard:[[{text:"🔙Назад",callback_data:"lang_main"}]]};}
  else if(d==="weather_main"){r="🌤️*ПОГОДА*";k={inline_keyboard:[[{text:"Москва",callback_data:"weather_msk"}],[{text:"🔙Назад",callback_data:"back"}]]};}
  else if(d.startsWith("weather_")){r=`🌤️${d.toUpperCase()}`;k={inline_keyboard:[[{text:"🔙Назад",callback_data:"weather_main"}]]};}
  else if(d==="inflation_main"){r="📊*ИНФЛЯЦИЯ*";k={inline_keyboard:[[{text:"Россия",callback_data:"infl_ru"}],[{text:"🔙Назад",callback_data:"back"}]]};}
  else if(d.startsWith("infl_")){r=`📊${d.toUpperCase()}`;k={inline_keyboard:[[{text:"🔙Назад",callback_data:"inflation_main"}]]};}
  if(r)await msg(id,r,k);
}

export default {
  async fetch(request, env, ctx) {
    const u = new URL(request.url);
    
    if(request.method==="GET"){
      if(u.searchParams.get("test")==="send"){
        const id=u.searchParams.get("chat")||"1271633868";
        await msg(id,"✅OK");
        return new Response("Sent to "+id);
      }
      // Статус с лимитами
      return new Response(`🤖Aiden PRO\n✅ Webhook Active\n💰 Free Plan\n⏱️ CPU: 10ms\n📊 100k/day`);
    }
    
    if(request.method==="POST"){
      try{
        const x=await request.json();
        if(x.message)await handleCmd(x.message,env);
        if(x.callback_query)await handleCb(x.callback_query,env);
        return new Response("OK");
      }catch(t){
        return new Response("Err:"+t.message,{status:500});
      }
    }
    
    return new Response("No",{status:405});
  }
};
