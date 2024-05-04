import { addKeyword } from '@builderbot/bot';
import flowRequisitos from "./flowRequisitos.js";
import flowAltaCliente from "./flowAltaCliente.js";
import databaseLogger from '../logger/databaseLogger.js';
import acciones from '../models/acciones.js';


const opcionesPermitidas = ["SOLICITAR", "REQUISITOS"];

const flowNoSoyCliente = addKeyword(["informacion","información"], {sensitive : false})
  .addAnswer(
    [
      "*-* Si deseas solicitar una tarjeta, responde *SOLICITAR*.", "",
      "*-* Si quieres conocer los requisitos para obtener una tarjeta, responde  *REQUISITOS*.",
    ],
    {capture : true},
    async (ctx, { fallBack}) => {
      
      databaseLogger.addLog(
        ctx.from,
        acciones.NOCLIENTE
      );
  
      if (!opcionesPermitidas.includes(ctx.body.toUpperCase())) {
         return fallBack("Lo siento, *"+ctx.body+"* no es una opción válida. Por favor, intenta de nuevo.*(SOLICITAR,REQUISITOS)*");
      }
    },
  [flowAltaCliente,flowRequisitos]
  );

  export default  flowNoSoyCliente;