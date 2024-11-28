import { addKeyword } from '@builderbot/bot';
import   {obtenerCuotasHabilitadas,    calcularFinanciacion,    otorgarPrestamo } from '../services/prestamos/servicePrestamos.js';
import { getClienteData, setClienteData } from "../models/clienteDATA.js";
import { logger, emailLogger } from '../logger/logger.js';
import { findCustomer } from "../services/dataclientes/clienteService.js";

import databaseLogger from '../logger/databaseLogger.js';
import acciones from '../models/acciones.js';

const flowPrestamosCliente = addKeyword("PRESTAMO", { sensitive: false })
  .addAnswer(
    ".",
    { capture: false },
    async (ctx, { flowDynamic, endFlow }) => {
      databaseLogger.addLog(ctx.from, acciones.PRESTAMO);

      setClienteData(ctx, {}); // Limpio el disponible desde la base de datos del cliente
      const cliente = await findCustomer(ctx);

      if (Object.keys(cliente).length > 0) {
        try {
          if (cliente.disponibleprestamo > 0) {
            return flowDynamic([
              {
                body: `💰💸 *Recuerda que el monto máximo que puedo ofrecerte por este medio es de ${cliente.disponibleprestamoformated}.*`,
              },
            ]);
          } else {
            console.log("cliente.disponibleprestamo > " + cliente.disponibleprestamo);
            return endFlow(
              "❌ Actualmente no puedo ofrecerte opciones de préstamo. Muchas gracias."
            );
          }
        } catch (error) {
          return endFlow(
            "⚠️ Ocurrió un error obteniendo tu disponible para préstamo. Por favor, reintenta luego. Muchas gracias."
          );
        }
      } else {
        return endFlow("Envia palabra *HOLA* para comenzar.");
      }
    }
  )
  .addAnswer(
    "💸 *¡Vamos a simular tu préstamo!* 📊 Por favor, dime cuánto dinero necesitas. Ingresa el monto en números con un mínimo de $5000.00 sin puntos ni comas (ejemplo: 10000).",
    { capture: true },
    async (ctx, { fallBack }) => {
      try {
        const cliente = getClienteData(ctx);
        if (Object.keys(cliente).length > 0) {
          const capitalRegex = /^\d+$/;
          if (
            capitalRegex.test(ctx.body) &&
            parseFloat(ctx.body) >= 5000.0 &&
            parseFloat(ctx.body) <= cliente.disponibleprestamo
          ) {
            cliente.capitalSolicitado = parseFloat(ctx.body);
            setClienteData(ctx, cliente);
          } else {
            return fallBack(
              `⚠️ *Por favor, ingresa un monto válido que sea mayor a $5,000.00 y no exceda ${cliente.disponibleprestamoformated}.*`
            );
          }
        }
      } catch (error) {
        logger.error("Error validando el monto ingresado en la simulación del préstamo:", error.stack);
      }
    }
  )
  .addAnswer(
    "📅 *Puedes elegir entre las siguientes opciones de cuotas:*",
    { capture: false },
    async (ctx, { endFlow, flowDynamic }) => {
      try {
        const cuotasDisponibles = await obtenerCuotasHabilitadas();
        let mensajeCuotas = "📊 *Cantidad de opciones disponibles para la financiación:*\n";
        cuotasDisponibles.cuotas.forEach((cuota) => {
          mensajeCuotas += `⿡ ${cuota.cuota} cuota${cuota.cuota > 1 ? "s" : ""}\n`;
        });
        await flowDynamic([{ body: mensajeCuotas }]);
      } catch (error) {
        emailLogger.error("Error al obtener cuotas habilitadas:", error.stack);
        return endFlow(
          "⚠️ *Lo siento, ocurrió un error al obtener las cuotas disponibles. Por favor, inténtalo de nuevo más tarde.*"
        );
      }
    }
  )
  .addAnswer(
    "🤔 *¿En cuántas cuotas deseas devolver el préstamo?* 🔢 Ingresa una de las opciones disponibles (solo números, por ejemplo: 3).",
    { capture: true },
    async (ctx, { fallBack }) => {
      const cuotasRegex = /^\d+$/;
      const clienteData = getClienteData(ctx);
      if (cuotasRegex.test(ctx.body) && parseInt(ctx.body) > 0) {
        clienteData.cuotas = parseInt(ctx.body);
        setClienteData(ctx, clienteData);
      } else {
        return fallBack("⚠️ Por favor, ingresa un número válido de cuotas.");
      }
    }
  )
  .addAnswer(
    "🔍 *Estoy buscando la mejor propuesta para ofrecerte.* ⏳ Dame unos momentos para personalizarla...",
    { capture: false },
    async (ctx, { flowDynamic, endFlow }) => {
      try {
        const clienteData = getClienteData(ctx);
        const resultado = await calcularFinanciacion(
          clienteData.capitalSolicitado,
          clienteData.cuotas,
          clienteData.diavencimiento
        );

        let detallesFinanciacion = `💸 *Detalles de la financiación:*\n*TNA:* ${resultado.tna}%\n*CFT:* ${resultado.cft}%\n💰 *Detalles de las cuotas:*\n`;
        resultado.cuotas.forEach((cuota) => {
          detallesFinanciacion += `*Cuota* ${cuota.cuota}° - *Vto:* ${cuota.fecha} - *Total:* $${cuota.total}\n`;
        });

        await flowDynamic([{ body: detallesFinanciacion }]);

        clienteData.detallesFinanciacion = detallesFinanciacion;
        setClienteData(ctx, clienteData);
        return endFlow(
          "🏢 *Acércate a nuestra sucursal más cercana.*\n📋 *SUJETO A EVALUACIÓN*\n🎉 *¡Tenés suerte... tenés DATA!*"
        );
      } catch (error) {
        logger.error("Error al calcular la financiación:", error.stack);
        emailLogger.error("Error al calcular la financiación:", error.stack);
        return endFlow(
          "⚠️ *Lo siento, ocurrió un error al calcular la financiación. Por favor, inténtalo de nuevo más tarde.*"
        );
      }
    }
  );


/*    
    .addAnswer( ["Responde *CONFIRMAR*  o *CANCELAR* para terminar este proceso.",
    "*Recuerda que al responder CONFIRMAR, estas aceptando nuestros términos y condiciones >  https://www.tarjetadata.com.ar/terminos-y-condiciones/*"],
    {capture:true},
    async (ctx, { flowDynamic,endFlow}) => {
        try {

            if (ctx.body.toLowerCase() == "cancelar" ){
              return endFlow("Entendemos que ahora no es el momento adecuado para ti. Igual siempre estaremos aquí para ayudarte. *Tenes suerte .. Tenes DATA !!*"); 
            }

            if (ctx.body.toLowerCase() == "confirmar" ){
              await flowDynamic([{ body: "*Procesando operación .....Aguarda unos instantes..!!*" }]);  
              const clienteData = getClienteData(ctx);

              const resultado = await servicePrestamos.otorgarPrestamo(
                  clienteData.tarjeta,
                  clienteData.digito,
                  0, // VERSION DEBE IR SIEMPRE EN 0
                  0, // ADICIONAL DEBE IR SIEMPRE EN 0
                  clienteData.capitalSolicitado, 
                  clienteData.cuotas
              );
              logger.info("******************************PRESTAMO GENARACION ****************************************************");
              logger.info(resultado); 
              logger.info("******************************************************************************************************");
              
              if (resultado.estado == "APROBADO"  &&  resultado.tipo == 1 ){                
                await flowDynamic([{ body: "*FELICITACIONES EL PRESTAMO FUE GENERADO EXITOSAMENTE !!!, EL DINERO ESTARA DISPONIBLE EN CUALQUIER SUCURSAL DE TARJETA DATA - Transaccion N° " + resultado.datos.venta + "*" }]);
                emailLogger.error("PRESTAMO OTORGADO A " + ctx.from + " POR UN TOTAL DE "+ clienteData.capitalSolicitado );  
              }else {
                emailLogger.error("Error al Otorgar un Prestamo :", resultado);
                await flowDynamic([{ body: "NO SE PUDO PROCESAR EL PRESTAMO : " + resultado.estado }]);
              } 
            }
            //return endFlow("*Promocion valida solo por 24hs - Acercate a nuestra Sucursal mas cercana.*\n *SUJETO A EVALUACION CREDITICIA.* \n *Tenes suerte .. Tenes DATA !!*");
        } catch (error) {
            emailLogger.error("Error GRAVE al Otorgar un Prestamo :", error);
            return endFlow("*Lo siento, ocurrió un error al calcular la financiación. Por favor, inténtalo de nuevo más tarde.....*");
        }finally{
          
        }
    }
);
*/


export default  flowPrestamosCliente;
