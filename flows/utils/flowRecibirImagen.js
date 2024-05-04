const {
    createBot,
    createProvider,
    createFlow,
    addKeyword,
    EVENTS,
  } = require("@bot-whatsapp/bot");
  const { downloadMediaMessage } = require("@adiwajshing/baileys");
  const BaileysProvider = require("@bot-whatsapp/provider/baileys");
  
  const { writeFileSync } = require("fs");
  
  const FirebaseAdapter = require("./firebase.class");
  
  const flowPrincipal = addKeyword(EVENTS.MEDIA).addAction(async (ctx) => {
  
    const buffer = await downloadMediaMessage(ctx, "buffer");
    writeFileSync("./images/dni-"+ctx.from+".jpeg", buffer)
  });
  
  const main = async () => {
    const adapterDB = new FirebaseAdapter();
    const adapterFlow = createFlow([flowPrincipal]);
    const adapterProvider = createProvider(BaileysProvider);
  
    createBot({
      flow: adapterFlow,
      provider: adapterProvider,
      database: adapterDB,
    });
  };
  
  main();