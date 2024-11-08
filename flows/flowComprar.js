import { addKeyword } from '@builderbot/bot';
import { getClienteData, setClienteData } from "../models/clienteDATA.js";
import { logger, emailLogger } from '../logger/logger.js';

import dotenv from "dotenv";
dotenv.config();

async function findComercio(numeroComercio) {
    try {
        var config = {
          method: "post",
          url: process.env.API_URL_COMERCIO_GET + numeroComercio ,
          headers: {
          },
        };
    
        const response = await axios(config);
        return response.data;
      } catch (e) {
        emailLogger.error("ERROR flowMain isRegisterClient > "+ e.stack);
        return null;
      }  
}

const flowComprar = addKeyword("COMPRAR-NOLOSE", { sensitive: false })
    .addAnswer(".",
        { capture: false },
        (ctx, { flowDynamic }) => {
            const cliente = getClienteData(ctx);
            return flowDynamic([{ body: `*Recuerda que tu disponible para compras actual es de: ${cliente.disponible}*` }]);
        }
    ).addAnswer(
        "*Para continuar ¿Me podrías proporcionar el importe de la compra *(ejemplo: 1000.00 )*, por favor?*",
    { capture: true },
    (ctx, { fallBack }) => {
      const clienteData = getClienteData(ctx);
      //const capitalRegex = /^\d+(\.\d{1,2})?$/;
      const capitalRegex = /^\d+$/;
      const disponiblePrestamo =clienteData.disponible.replace("$","").replace(".","").replace(",",".");
      if (capitalRegex.test(ctx.body) && (parseFloat(ctx.body) > 0.00 && parseFloat(ctx.body) <= disponiblePrestamo) ) {
        clienteData.totalcompra = parseFloat(ctx.body);
        setClienteData(ctx, clienteData);
      } else {
        return fallBack(`Por favor, ingresa un monto válido que no exceda ${disponiblePrestamo}.`);
      }
    }
  )
  .addAnswer(
    "*Puedes elegir entre las siguientes opciones de cuotas*",
    { capture: false },
    async (ctx, { fallBack, flowDynamic }) => {
        try {
            const cuotasDisponibles = await servicePrestamos.obtenerCuotasHabilitadas();
            let mensajeCuotas = "*Cantidad de opciones disponibles para la financiación:*\n";
            let i = 1;
            cuotasDisponibles.cuotas.forEach(cuota => {                
                if (i==1){
                    mensajeCuotas += `${cuota.cuota} cuota\n`;
                }else {
                    mensajeCuotas += `${cuota.cuota} cuotas\n`;
                }
                i++;
            });
            await flowDynamic([{ body: mensajeCuotas }]);
        } catch (error) {
            emailLogger.error("Error al obtener cuotas habilitadas:", error);
            return fallBack("*Lo siento, ocurrió un error al obtener las cuotas disponibles. Por favor, inténtalo de nuevo más tarde.*");            
        }
    }
)
  .addAnswer(
    "*¿En cuántas cuotas deseas devolver el préstamo? Ingresa una de las opciones disponibles.(Solo Números. ej:3)*",
    { capture: true },
    (ctx, { fallBack }) => {
      const cuotasRegex = /^\d+$/;
      const clienteData = getClienteData(ctx);
      if (cuotasRegex.test(ctx.body) && parseInt(ctx.body) > 0) {
        clienteData.cuotas = parseInt(ctx.body);
        setClienteData(ctx, clienteData);
      } else {
        return fallBack("Por favor, ingresa un número válido de cuotas.");
      }
    }
  )
  .addAction(
        async (ctx, { flowDynamic, endFlow }) => {
            try {
                await flowDynamic([{ body: "Calculando tu financiación..." }]);

                const clienteData = getClienteData(ctx);
                const resultado = await servicePrestamos.calcularFinanciacion(
                    clienteData.capitalSolicitado, 
                    clienteData.cuotas, 
                    clienteData.diavencimiento
                );

                let detallesFinanciacion = `*Detalles de la financiación:*\n*TNA:* ${resultado.tna}%\n*Detalles de las cuotas:*\n`;
                resultado.cuotas.forEach(cuota => {
                    detallesFinanciacion += `*Cuota* ${cuota.cuota}° *- Vto:* ${cuota.fecha} *- Total:* $${cuota.total}*\n`;
                });

                await flowDynamic([
                    { body: detallesFinanciacion }
                ]);
                return endFlow("Si tienes más preguntas o necesitas ayuda, no dudes en contactarme nuevamente. *Tenes suerte .. Tenes DATA !!*");
            } catch (error) {
                emailLogger.error("Error al calcular la financiación:", error);
                await flowDynamic([{ body: "*Lo siento, ocurrió un error al calcular la financiación. Por favor, inténtalo de nuevo más tarde.....*" }]);
                return endFlow();
            }
        }
    );


export default flowComprar;
