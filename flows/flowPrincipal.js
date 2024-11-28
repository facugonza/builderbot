import { addKeyword, EVENTS } from '@builderbot/bot';
import flowValidarCliente from "./flowValidarCliente.js";
import flowNoSoyCliente from "./flowNoSoyCliente.js";

const opcionesPermitidas = ["CLIENTE", "INFORMACION","INFORMACIÓN"]; //, "OPERADOR"

const flowPrincipal = addKeyword("flowPrincipalTelefonoNoAsociado", { sensitive: false })
  .addAnswer(
    [
      "📌 *-* Si ya eres cliente y necesitas asistencia, responde con la palabra *CLIENTE*.",
      "",
      "📌 *-* Si aún no eres cliente y deseas obtener información, responde con la palabra *INFORMACION*.",
      "",
      //"📞 *-* Si prefieres hablar directamente con un operador, responde con la palabra *OPERADOR*.",
    ],
    { capture: true },
    async (ctx, { fallBack }) => {
      if (!opcionesPermitidas.includes(ctx.body.toUpperCase())) {
        return fallBack(
          `❌ Lo siento, *${ctx.body}* no es una opción válida. Por favor, intenta de nuevo. *(CLIENTE, INFORMACION)*`
        );
      }
    },
    [flowValidarCliente, flowNoSoyCliente]
  );

export default flowPrincipal;
