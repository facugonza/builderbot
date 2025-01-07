import { addKeyword } from '@builderbot/bot';
import   {obtenerCuotasHabilitadas,    calcularFinanciacion,    otorgarPrestamo } from '../services/prestamos/servicePrestamos.js';
import { getClienteData, setClienteData } from "../models/clienteDATA.js";
import { logger, emailLogger } from '../logger/logger.js';
import { findCustomer } from "../services/dataclientes/clienteService.js";

import databaseLogger from '../logger/databaseLogger.js';
import acciones from '../models/acciones.js';

const flowPrestamosCliente = addKeyword("PRESTAMO", { sensitive: false })
    .addAnswer(".",
        { capture: false },
        async (ctx, { flowDynamic,endFlow }) => {

          databaseLogger.addLog(
            ctx.from,
            acciones.PRESTAMO
          );
    
          setClienteData(ctx, {}); // LIMPIO EL DISPONIBLE DESDE LA BASE  DE DATOS  DEL CLIENTE
          const cliente = await findCustomer(ctx);

          if (Object.keys(cliente).length > 0){
            try{              
              if (cliente.disponibleprestamo> 0 ){
                return flowDynamic([{ body: `💰💸 *Recuerda que el monto maximo que puedo ofrecerte por este medio es de ${cliente.disponibleprestamoformated}*` }]);
              }else {
                console.log("cliente.disponibleprestamo > " +cliente.disponibleprestamo);

                return endFlow(`❌ Actualmente no puedo ofrecerte opciones de Prestamo ..  Muchas gracias.`);
              }
            }catch(error){
              return endFlow(`⚠️ Ocurrio error obteniendo tu disponible para prestamo, por favor reintenta luego .. Muchas gracias`);
            }
          }else {
            return endFlow("Envia palabra *HOLA* para comenzar..");
          }
        }
    ).addAnswer(
        "💸 ¡Vamos a Simular tu Préstamo! 📊 Por favor, dime cuánto dinero necesitas. *Ingresa el monto en números con un minino de $ 5000.00 sin puntos ni comas (ejemplo: 10000).*",
    { capture: true },
    async (ctx, { fallBack }) => {
      try{
        const cliente = getClienteData(ctx);
        if (Object.keys(cliente).length > 0){        
            //await flowDynamic([{ body:"*¡Vamos a Simular tu Préstamo! Por favor, dime cuánto dinero necesitas. Ingresa el monto en números sin puntos ni comas (ejemplo: 10000).*"}]);
            //const capitalRegex = /^\d+(\.\d{1,2})?$/;
            const capitalRegex = /^\d+$/;
            //const disponiblePrestamo =clienteData.disponible.replace("$","").replace(".","").replace(",",".");
            if (capitalRegex.test(ctx.body) && (parseFloat(ctx.body) >= 5000.00 && parseFloat(ctx.body) <= cliente.disponibleprestamo) ) {
              cliente.capitalSolicitado = parseFloat(ctx.body);
              setClienteData(ctx, cliente);
            } else {
              return fallBack(`⚠️ *Por favor, ingresa un monto válido que sea mayor a $5.000,00 y no exceda ${cliente.disponibleprestamoformated}.*`);
            }
        }
      }catch(error){
        logger.error("Error validando el monto ingresado en la simulacion del prestamo :", error.stack);
      }
    }
  )
  .addAnswer(
    "📅 *Puedes elegir entre las siguientes opciones de cuotas:*",
    { capture: false },
    async (ctx, { endFlow, flowDynamic }) => {
        try {
            const cuotasDisponibles = await obtenerCuotasHabilitadas();
            let mensajeCuotas = "📊*Cantidad de opciones disponibles para la financiación:*\n";
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
            emailLogger.error("Error al obtener cuotas habilitadas:", error.stack);
            return endFlow("⚠️*Lo siento, ocurrió un error al obtener las cuotas disponibles. Por favor, inténtalo de nuevo más tarde.*");            
            
        }
    }
)
  .addAnswer(
    "🤔*¿En cuántas cuotas deseas devolver el préstamo? 🔢 Ingresa una de las opciones disponibles.(Solo Números. ej:3)*",
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
  .addAnswer("🔍 *Estoy buscando la mejor propuesta para ofrecerte.⏳ Dame unos momentos para personalizarla.....*",
        {capture:false},
        async (ctx, { flowDynamic,endFlow}) => {
            try {
                //await flowDynamic([{ body: "*Estoy buscando la mejor propuesta para ofrecerte. Dame unos momentos para personalizarla.....*" }]);
                
                console.log("PSAE EL FLOW DINAMYC"); 

                const clienteData = getClienteData(ctx);
                const resultado = await calcularFinanciacion(
                    clienteData.capitalSolicitado, 
                    clienteData.cuotas, 
                    clienteData.diavencimiento
                );
                logger.info("PASE EL LLAMADO DE CALCULO DE FINANCIACION : "); 

                let detallesFinanciacion = `💸 *Detalles de la financiación:*\n*TNA:* ${resultado.tna}%\n*CFT:* ${resultado.cft}%\n*Detalles de las cuotas:*\n`;
                resultado.cuotas.forEach(cuota => {
                    detallesFinanciacion += `*Cuota* ${cuota.cuota}° *- Vto:* ${cuota.fecha} *- Total:* $${cuota.total}\n`;
                });
                

                await flowDynamic([
                    { body: detallesFinanciacion }
                ]);
                
                clienteData.detallesFinanciacion = detallesFinanciacion; 
                setClienteData(ctx, clienteData);
                if (ctx.from === "54264736151" || ctx.from === "549264481-4441"){ 
                
                } else {
                  return endFlow("🏢 Acercate a nuestra Sucursal mas cercana.*\n 📋 *SUJETO A EVALUACION* \n *Tenes suerte .. Tenes DATA !!*");
                } 
                

            } catch (error) {
                logger.error("Error al calcular la financiación:", error.stack);
                emailLogger.error("Error al calcular la financiación:", error.stack);
                //await flowDynamic([{ body: "*Lo siento, ocurrió un error al calcular la financiación. Por favor, inténtalo de nuevo más tarde.....*" }]);
                return endFlow("⚠️ *Lo siento, ocurrió un error al calcular la financiación. Por favor, inténtalo de nuevo más tarde.....*");
            }
        }
    )
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
