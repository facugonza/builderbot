import dotenv from "dotenv";
dotenv.config();

import { addKeyword, EVENTS } from '@builderbot/bot';
import { logger, emailLogger } from '../logger/logger.js';
import { findCustomer } from "../services/dataclientes/clienteService.js";
import { findComercio,findPlanActiveByComercio,procesarCompra } from "../services/compras/comprasService.js";

const flowPagarCompras = addKeyword("COMPRA", "COMPRAR", { sensitive: false })
  .addAnswer(".",
    { capture: false },
    async (ctx, { flowDynamic, state }) => {
      state.clear();
      const cliente = await findCustomer(ctx);

      if (Object.keys(cliente).length > 0) {
        return flowDynamic([{ body: `Recuerda que tu saldo disponible para compras actual es de: ${cliente.disponible}` }]);
      } else {
        return flowDynamic(".");
      }
    }
  )
  .addAnswer(
    "Para continuar *¿Me podrías proporcionar numero de comercio, por favor? Solo números (ej. 4500)* ",
    { capture: true },
    async (ctx, { fallBack, flowDynamic, state }) => {
      try {
        const comercioRegex = /^\d{1,6}$/;
        console.log("Número de comercio recibido: ", ctx.body);
        if (comercioRegex.test(ctx.body)) {
          const comercio = await findComercio(ctx.body);
          if (comercio) {
            const infoCompra = {};
            infoCompra.comercio = comercio;
            infoCompra.numeroComercio = ctx.body;
            await state.update({ venta: infoCompra });
            //return await flowDynamic([{ body: "*Estas por realizar compra en : " + infoCompra.comercio.puntos[0].descrpto + "*" }]);
          } else {
            console.log("Comercio no encontrado en la base de datos");
            return fallBack("Numero de comercio : " + ctx.body + " no encontrado en nuestras base de datos !!!!");
          }
        } else {
          console.log("Número de comercio no válido: ", ctx.body);
          return fallBack("El numero de comercio (" + ctx.body + ") no es válido !!! Reingresalo.");
        }
      } catch (error) {
        console.log("Error al buscar el comercio: ", error.stack);
        emailLogger.error(error.stack);
        logger.error(error.stack);
      }
    }
  )
  .addAnswer(
    "Aguarda un instante.. estoy obteniendo los datos del comercio...!!!",
    { capture: false },
    async (ctx, { flowDynamic, state }) => {
      const compra = await state.get("venta");
      const comercio = compra.comercio;
      await flowDynamic([{ body: "*Estas por realizar compra en :" + comercio.puntos[0].descrpto + "*" }]);
    }
  )
  .addAnswer(
    "Para continuar *¿Me podrías proporcionar el importe de la compra, por favor? (Ejemplo: 1000.00 )*",
    { capture: true },
    async (ctx, { fallBack, state }) => {
      const importeRegex = /^\d+(\.\d+)?$/;
      if (importeRegex.test(ctx.body)) {
        await state.update({ importeCompra: parseFloat(ctx.body) });
      } else {
        return fallBack("*El importe ingresado " + ctx.body + " no es valido por favor .. reingresalo (Ejemplo: 1000.00 )*.");
      }
    }
  )
  .addAnswer(
    "*Por favor reingresa nuevamente el importe para confirmarlo y continuar con la operacion.*",
    { capture: true },
    async (ctx, { fallBack, state }) => {
      const importeRegex = /^\d+(\.\d+)?$/;
      if (importeRegex.test(ctx.body)) {
        const importeCompraFirst = state.get("importeCompra");
        if (importeCompraFirst != parseFloat(ctx.body)) {
          return fallBack(
            "*El importe ingresado $" + ctx.body + " no coincide con el importe ingresado previamente.*"
          );
        }
      } else {
        return fallBack(
          "*El importe ingresado $" + ctx.body + " no es válido por favor .. reingresalo (ejemplo: 1000.00 )*."
        );
      }
    }
  )
  .addAnswer(
    "*Obteniendo opciones de pago. Aguarda un instante....!*",
    { capture: false },
    async (ctx, { flowDynamic, endFlow, state }) => {
      try {
        const compra = state.get("venta");
        const planActivo = findPlanActiveByComercio(compra.comercio, compra.numeroComercio); 
        compra.planActivo = planActivo;
          
        if (planActivo === 53) {
          compra.opcionesCuotas = [1]
        } else if (planActivo === 1) {
          compra.opcionesCuotas = [1];
        } else if (planActivo === 2) {
          compra.opcionesCuotas = [1,3,6,12];
        } else {
          return endFlow("Lo siento, no hay ningun Plan Activo disponible en este Comercio.!!! ");
        }
        
        await state.update({ venta: compra });
        flowDynamic([{
           body: `*Estas son las cuotas disponibles para el comercio: ${compra.comercio.puntos[0].descrpto}*\n\n*Cuotas disponibles:*\n${compra.opcionesCuotas.join('\n')}`
        }]);

      } catch (error) {
        emailLogger.error(error.stack);
        logger.error(error.stack);
        return endFlow("*OCURRIO UN ERROR PROCESANDO LA OPERACION REINTENTA LUEGO .... !! MUCHAS GRACIAS ");
      }
    }
  )
  .addAnswer(
    "*Ingresa la cantidad de cuotas seleccionada en numeros, por favor.*",
    { capture: true },
    async (ctx, { fallBack, flowDynamic, state }) => {
        const compra = state.get("venta");                
        const cantidadCuotasRegex = /^\d{1,2}$/;
        const importeCompra = state.get("importeCompra");
        if (cantidadCuotasRegex.test(ctx.body)) {
          const cuotasIngresadas = parseInt(ctx.body, 10);
          if (compra.opcionesCuotas.includes(cuotasIngresadas)) {
            compra.cuotasSeleccionadas = cuotasIngresadas; 
            await state.update({ venta: compra });         
            const leyendaCuotas = cuotasIngresadas !== 1 ? "cuotas" : "cuota";
            await flowDynamic([{ body: `*Confirmas la compra en comercio: ${compra.comercio.puntos[0].descrpto} por un importe de $${importeCompra} en ${cuotasIngresadas} ${leyendaCuotas}*` }]);
          } else {
            return fallBack(`*La cantidad de cuotas ingresada no es válida. Por favor, elige entre las opciones disponibles: ${compra.opcionesCuotas.join(", ")}*`);
          }
        }else {
          return fallBack("El numero de cuotas ingresado (" + ctx.body + ") no es válido !!! Por favor reingresalo.");
        }
    }
)  
  .addAnswer(
    "*Por último, para confirmar operación ingresa tu numero de DNI. Solo números sin puntos*",
    { capture: true },
    async (ctx, { fallBack, endFlow, flowDynamic, state }) => {
      try {
        const MAX_INTENTOS = 3;  // Límite de intentos permitidos
        const cantidadIntentos = state.get("cantidadIntentos") || 1;
        const dniRegex = /^\d{1,8}$/;
        if (dniRegex.test(ctx.body)) {
          const dniIngresado = parseInt(ctx.body);
          const cliente = await findCustomer(ctx);

          if (dniIngresado == cliente.documento) {
            const result = await procesarCompra(cliente, state);
            if (result.success) {
              flowDynamic([
                {
                  body: result.message,
                  media: "https://i.postimg.cc/GmLjpD8M/descarga.png",
                },
              ]);
            }else {
              flowDynamic([
                {
                  body: result.message
                },
              ]);
            }
            state.clear();            
            return endFlow("Tenes Suerte, Tenes DATA!");  
          } else {
            if (cantidadIntentos <= MAX_INTENTOS ) {
              const cantidadIntentosActual = cantidadIntentos + 1;
              await state.update({ cantidadIntentos:cantidadIntentosActual });                             

              return fallBack("*EL NUMERO INGRESADO NO COINCIDE CON NUESTROS REGISTROS, REINGRESA EL NUMERO DE DNI...!!!* ");
            } else {
              emailLogger.error("INTENTO DE COMPRA QUE SUPERO LA CANTIDAD DE INGRESOS DE DNI : " + ctx.body + " EN EL CLIENTE DESDE EL TELEFONO : " + ctx.from);
              return endFlow("*EL NUMERO DE DNI INGRESADO NO COINCIDE CON NUESTROS REGISTROS Y SUPERASTE LA CANTIDAD DE REINTENTOS...EL PROCESO SE CANCELARA Y SERA NOTIFICADO POR MEDIDAS DE SEGURIDAD!!!* ");
            }
          }
        } else {
          return fallBack("*EL NUMERO INGRESADO NO ES VÁLIDO , SOLO SE ACEPTAN NUMEROS.. (Ej: 22159357) !!!* ");
        }
      } catch (error) {
        emailLogger.error(error.stack);
        logger.error(error.stack);
        return endFlow("*Ocurrió un error procesando la operación. Inténtalo nuevamente más tarde. Muchas gracias.*");
      } 
    }
  );

export default flowPagarCompras;
