const { addKeyword } = require("@bot-whatsapp/bot");
const { getClienteData,setClienteData } = require("../models/clienteDATA");
const { findCustomer } = require("../services/dataclientes/clienteService");

const flowSaldoPagar = addKeyword("deuda", { sensitive: false })
  .addAnswer(
    ".",
    { delay: 1000 },
    async (ctx, { flowDynamic }) => {
      const cliente = await findCustomer(ctx);

      if (Object.keys(cliente).length > 0) {
        await flowDynamic([
          {
            body: "⏳ *Aguarda un instante, estoy obteniendo el total del último resumen...*",
          },
        ]);
        await flowDynamic([
          {
            body: `💳 *El saldo a pagar de tu último resumen es de: $${cliente.resumentotal}.*`,
          },
        ]);
        setClienteData(ctx, {});
      }
    }
  )
  .addAnswer(
    "✅ *Si tienes más preguntas o necesitas ayuda, no dudes en contactarme nuevamente.*\n🎉 *¡Tenés suerte... tenés DATA!*"
  );



/*
.addAnswer("1) ¿Deseas consultar tu saldo disponible? responde *saldo* \n\n" + 
"2) ¿Quieres saber cuánto debes? responde *deuda* \n\n" + 
"3) ¿Necesitas descargar un resumen de tu cuenta? responde *resumen* \n\n"  +
"4) ¿Prefieres hablar con un operador humano? responde *operador* \n\n" +       
"5) ¿Te gustaría conocer nuestras promociones vigentes? responde *promos* \n\n" +
"6) ¿Deseas desvincular este numero de telefono de la cuenta? responde *desvincular*" 
);
*/

module.exports = flowSaldoPagar;