import { addKeyword } from '@builderbot/bot';
import { getClienteData, setClienteData } from "../models/clienteDATA.js";
import createGroup from '../services/groups/createGroup.js';
import { logger, emailLogger } from '../logger/logger.js';
import databaseLogger from '../logger/databaseLogger.js';
import acciones from '../models/acciones.js';


function isWithinWorkingHours() {
  const currentHour = new Date().getHours();
  

  // Nueva franja horaria: 08:00 a 21:00
  const isWithinNewHours = currentHour >= 8 && currentHour < 21;

  // Días laborables: lunes (0) a viernes (4)
  const currentDay = new Date().getDay();
  const isWorkingDay = currentDay >= 1 && currentDay <= 5;

  console.log("currentHour" + currentHour);
  console.log("isWithinNewHours" + isWithinNewHours);
  console.log("currentDay" + currentDay);
  console.log("isWorkingDay" + isWorkingDay);


  return isWithinNewHours && isWorkingDay;
}

async function generateAlphabeticCode(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charactersLength = characters.length;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const flowAgente = addKeyword("operador", { sensitive: false })
  .addAnswer(
    "💬 Recuerda que solo podemos ayudarte si tienes agendado este número como contacto. Aguarda un instante... ⏳"
  )
  .addAction(async (ctx, { provider, flowDynamic }) => {
    databaseLogger.addLog(
      ctx.from,
      acciones.OPERADOR
    );

    const refProvider = await provider.getInstance();

    if (isWithinWorkingHours()) {
      const ID_GROUP = await generateAlphabeticCode(7);
      const groupCreated = await refProvider.groupCreate(
        `Tarjeta DATA (${ID_GROUP})`,
        [
          `${ctx.from}@c.us`,
          `5492644711445@c.us`, // SOPORTE DEPARTAMENTOS CÓDIGOS
        ]
      );

      const addedGroupMessage =
        "🎉 ¡Excelente! Te hemos agregado a un grupo de WhatsApp con nuestros asesores. 💼 Ellos te ayudarán con tus consultas. ¡Muchas gracias! 😊";

      try {
        const cliente = getClienteData(ctx);
        const insertId = await createGroup(
          ctx.from,
          groupCreated.id,
          ID_GROUP,
          cliente.documento
        );
        logger.log("✅ Grupo insertado con éxito, ID:", insertId);
      } catch (error) {
        logger.error(
          "❌ Error insertando Grupo Code:",
          ID_GROUP + " > " + error.stack
        );
      }

      return flowDynamic([{ body: addedGroupMessage }]);
    } else {
      const outsideWorkingHoursMessage =
        "⏰ Nuestros horarios de atención de los operadores son de *08:00 a 21:00 hs, de lunes a viernes*. Por favor, vuelve a contactarnos dentro de ese horario. ¡Gracias! 😊";
      return flowDynamic([{ body: outsideWorkingHoursMessage }]);
    }

    setClienteData(ctx, {});
  });

export default flowAgente;
