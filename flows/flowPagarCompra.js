import dotenv from "dotenv";
dotenv.config();

import { addKeyword, EVENTS } from '@builderbot/bot';
import { logger, emailLogger } from '../logger/logger.js';
import axios from "axios";
import { setClienteData } from "../models/clienteDATA.js";
import fs from "fs";
import { findCustomer } from "../services/dataclientes/clienteService.js";
import { Console } from "console";

// Función para generar el request_id con formato específico
function generarRequestId() {
  const fecha = new Date();
  const formatoFechaHora = 
      String(fecha.getDate()).padStart(2, '0') + // Día (dd)
      String(fecha.getMonth() + 1).padStart(2, '0') + // Mes (MM)
      fecha.getFullYear() + // Año (yyyy)
      String(fecha.getHours()).padStart(2, '0') + // Hora (HH)
      String(fecha.getMinutes()).padStart(2, '0') + // Minutos (mm)
      String(fecha.getSeconds()).padStart(2, '0'); // Segundos (ss)
      String(fecha.getMilliseconds()).padStart(2, '0'); // Segundos (ss)
  
  return `${formatoFechaHora}`; // Formato: tarjeta-fechaHora
}

// Función para verificar si Plan D está activo en el JSON del comercio
function getSomePlanActive(comercio, numeroComercio) {
  if (!comercio || !comercio.planes) {
    console.log("El comercio o los planes no existen:", comercio);
    return 0; // Retorna 0 si no existen planes
  }

  // Primero verificar si existe el plan 53 (Plan D)
  const hasPlanD = comercio.planes.find(plan => plan.planesPK.clavepln === 53);
  if (hasPlanD) {
    return 53;
  }

  // Si no tiene plan 53, verificar el plan 1
  const hasPlan1 = comercio.planes.find(plan => plan.planesPK.clavepln === 1);
  if (hasPlan1) {
    return 1;
  }

  const comercioAutorizados = [21, 4840, 4500, 5000];
  if (comercioAutorizados.includes(Number(numeroComercio))) {
    const hasPlan2 = comercio.planes.some(plan => {
      
      return plan.planesPK.clavepln === 2;
    });

    if (hasPlan2) return 2;
  }

  return 0; // Si no tiene ninguno de los planes anteriores, retornar 0
}


// Función para procesar la venta
async function procesarCompra(cliente, state) {
  const tarjeta = cliente.tarjeta; 
  const dni = cliente.documento;

  // Asignar el request_id usando el DNI y la fecha
  const requestId = generarRequestId(tarjeta);
  const compra = state.get("venta");
  const importeCompra = state.get("importeCompra");

  const compraQREstatico = {
    tipo_user_id: 9,
    tipo_user: "APP_QR",
    request_id: requestId, 
    documento: dni,
    plastico: cliente.plastico.replace(/\s+/g, '').trim(),
    vtoplastico: cliente.vtotarjeta,
    cuitcomercio: compra.comercio.puntos[0].cuitxpto,
    empresa: compra.numeroComercio,
    puntovta: 1,
    numcaja: 1,
    total: importeCompra,
    planvta: compra.planActivo, // Plan D o 1 cuota
    cuotasvta: 1, // Cuotas según Plan D o 1
    fecha: new Date().toISOString(),
    observacionvta: "API_REST_34_APPMOVILE_QR",
    token: "",
  };

  console.log('JSON DE LA COMPRA > :', compraQREstatico);

  try {
    const response = await axios.post('http://200.70.56.203:8021/AppMovil/ApiComercioVenta', compraQREstatico, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('Venta procesada exitosamente:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al procesar la venta:', error);
    throw new Error('No se pudo procesar la venta');
  }
}

async function createDirectoryIfNotExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
}

async function findComercio(numeroComercio) {
  try {
    console.log("entre a findcomercio");
    const apiUrl = process.env.API_URL_COMERCIO_GET;
    if (!apiUrl) {
      console.log("ERROR: API_URL_COMERCIO_GET no está definido en el archivo .env o está vacío");
      return null;
    }

    const fullUrl = apiUrl.endsWith('/') ? apiUrl + numeroComercio : apiUrl + numeroComercio;
    console.log("URL completa para solicitud de comercio:", fullUrl);
    if (!fullUrl.startsWith("http")) {
      console.log("ERROR: La URL generada no es válida, revisa la configuración del archivo .env");
      return null;
    }

    var config = {
      method: "post",  // Cambiado a POST
      url: fullUrl,
      headers: {},
    };

    const response = await axios(config);
    console.log("Número de comercio solicitado:", numeroComercio);

    if (response.status !== 200) {
      console.log("Error en la solicitud: código de estado", response.status);
      return null;
    }
    return response.data;
  } catch (e) {
    console.log("Error al hacer la solicitud:", e.message);
    emailLogger.error("ERROR flowMain isRegisterClient > " + e.stack);
    return null;
  }  
}

async function findCuotasComercio(numeroComercio) {
  try {
    const config = {
      method: "get",
      url: process.env.API_URL_CUOTAS_GET + numeroComercio,
      headers: {},
    };

    const response = await axios(config);
    return response.data;
  } catch (e) {
    emailLogger.error("ERROR flowMain getCuotasOptions > " + e.stack);
    return null;
  }
}

const flowPagarCompras = addKeyword("COMPRA", "COMPRAR", { sensitive: false })
  .addAnswer(".",
    { capture: false },
    async (ctx, { flowDynamic, state }) => {
      state.clear();
      const cliente = await findCustomer(ctx);

      if (Object.keys(cliente).length > 0) {
        return flowDynamic([{ body: `Recuerda que tu disponible para compras actual es de: ${cliente.disponible}` }]);
      } else {
        return flowDynamic(".");
      }
    }
  )
  .addAnswer(
    "Para continuar *¿Me podrías proporcionar numero de comercio, por favor? Solo numeros (ej. 45000)* ",
    { capture: true },
    async (ctx, { fallBack, flowDynamic, state }) => {
      try {
        const comercioRegex = /^\d{1,6}$/;
        console.log("Número de comercio recibido: ", ctx.body);
        if (comercioRegex.test(ctx.body)) {
          //flowDynamic([{ body: "Aguarda un instante.. estoy obteniendo los datos del comercio...!!!" }]);
          const comercio = await findComercio(ctx.body);
          if (comercio) {
            const infoCompra = {};
            infoCompra.comercio = comercio;
            infoCompra.numeroComercio = ctx.body;
            await state.update({ venta: infoCompra });
            return await flowDynamic([{ body: "*Estas por realizar compra en : " + infoCompra.comercio.puntos[0].descrpto + "*" }]);
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
    "Para continuar *¿Me podrías proporcionar el importe de la compra (ejemplo: 1000.00 ), por favor?*",
    { capture: true },
    async (ctx, { fallBack, state }) => {
      const importeRegex = /^\d+(\.\d+)?$/;
      if (importeRegex.test(ctx.body)) {
        const cliente = await findCustomer(ctx);
        await state.update({ importeCompra: parseFloat(ctx.body) });
      } else {
        return fallBack("*El importe ingresado " + ctx.body + " no es valido por favor .. reingresalo (ejemplo: 1000.00 )*.");
      }
    }
  )
  .addAnswer(
    "*Por favor reigresa nuevamente el importe para confirmar el monto y continuar con la operacion.*",
    { capture: true },
    async (ctx, { fallBack, state }) => {
      const importeRegex = /^\d+(\.\d+)?$/;
      if (importeRegex.test(ctx.body)) {
        const importeCompraFirst = state.get("importeCompra");
        if (importeCompraFirst != parseFloat(ctx.body)) {
          return fallBack(
            "*El importe ingresado  " + ctx.body + " no es coincide con el importe ingresado previamente*."
          );
        }
      } else {
        return fallBack(
          "*El importe ingresado  " + ctx.body + " no es valido por favor .. reingresalo (ejemplo: 1000.00 )*."
        );
      }
    }
  )
  .addAnswer(
    "Validando datos ingresados... ..",
    { capture: false },
    async (ctx, { flowDynamic, endFlow, state }) => {
      try {
        const compra = state.get("venta");
        const importeCompra = state.get("importeCompra");
        const planActivo = getSomePlanActive(compra.comercio, compra.numeroComercio); // Obtener el plan activo con prioridad
        
        compra.planActivo = planActivo;
        await state.update({ venta: compra });

        if (planActivo === 53) {
          // Si el plan activo es Plan D (clavepln = 53)
          flowDynamic([{
            body: `*Confirmas compra en ${compra.comercio.puntos[0].descrpto} por un importe de $${importeCompra} en PLAN D?*`
          }]);
        } else if (planActivo === 1) {
          // Si el plan activo es de 1 cuota (clavepln = 1)
          flowDynamic([{
            body: `*Confirmas compra en ${compra.comercio.puntos[0].descrpto} por un importe de $${importeCompra} en 1 CUOTA?*`
          }]);
        } else if (planActivo === 2) {
          flowDynamic([{
            body: `*Confirmas compra en ${compra.comercio.puntos[0].descrpto} por un importe de $${importeCompra} en 1 CUOTA -.?*`
          }]);
        } else {
          // Si no hay ningún plan disponible
          return endFlow("Lo siento, no hay ningun Plan Activo disponible en este Comercio.");
        }
      } catch (error) {
        emailLogger.error(error.stack);
        logger.error(error.stack);
        return endFlow("*OCURRIO UN ERROR PROCESANDO LA OPERACION REINTENTA LUEGO .... !! MUCHAS GRACIAS ");
      }
    }
  )
  .addAnswer(
    "*Para confirmar operacion ingresa tu numero de DNI.* (Ej: 22123456)",
    { capture: true },
    async (ctx, { fallBack, endFlow, flowDynamic, state }) => {
      try {
        let cantidadIntentos = 1;
        const dniRegex = /^\d{1,8}$/;
        if (dniRegex.test(ctx.body)) {
          const dniIngresado = parseInt(ctx.body);
          const cliente = await findCustomer(ctx);
          const compra = state.get("venta");
          const planActivo = compra.planActivo;

          if (dniIngresado == cliente.documento) {
            const transactionId = await procesarCompra(cliente, state);
            await flowDynamic([
              {
                body: "*Operación exitosa. El número de transacción es  N°: " + transactionId + "*",
                media: "https://i.postimg.cc/GmLjpD8M/descarga.png",
              },
            ]);
            state.clear();
            return endFlow("*Muchas Gracias. TENES SUERTE, TENES DATA!* ");
          } else {
            if (cantidadIntentos < 3) {
              return fallBack("*EL NUMERO INGRESADO NO COINCIDE CON NUESTROS REGISTROS, REINGRESA EL NMUMERO DE DNI...!!!* ");
            } else {
              emailLogger.error("INTENTO DE COMPRA QUE SUPERO LA CANTIDAD DE INGRESOS DE DNI : " + ctx.body + " EN EL CLIENTE DESDE EL TELEFONO : " + ctx.from);
              return endFlow("*EL NUMERO DE DNI INGRESADO NO COINCIDE CON NUESTROS REGISTROS Y SUPERASTE LA CANTIDAD DE REINTENTOS...EL PROCESO SE CANCELARA !!!* ");
            }
            cantidadIntentos++;
          }
        } else {
          return fallBack("*EL NUMERO INGRESADO NO ES VALIDO , SOLO SE ACEPTAN NUMEROS.. (Ej: 22159357) !!!* ");
        }
      } catch (error) {
        emailLogger.error(error.stack);
        logger.error(error.stack);
        return endFlow("*OCURRIO UN ERROR PROCESANDO LA OPERACION REINTENTA LUEGO .... !! MUCHAS GRACIAS ");
      }
    }
  );

export default flowPagarCompras;
