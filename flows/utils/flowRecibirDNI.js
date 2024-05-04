  const {addKeyword,EVENTS } = require("@bot-whatsapp/bot");
  const { downloadMediaMessage } = require("@adiwajshing/baileys");
  
  const { writeFileSync } = require("fs");
  
  const flowRecibirDNI = addKeyword(EVENTS.MEDIA).addAction(async (ctx) => {
    console.log("RECEIVING IMAGE : " + ctx.from);
    const buffer = await downloadMediaMessage(ctx, "buffer");
    writeFileSync("./images/dni-"+ctx.from+".jpeg", buffer);
});
  
  module.exports = flowRecibirDNI;