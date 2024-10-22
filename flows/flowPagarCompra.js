import dotenv from "dotenv";
dotenv.config();

import { addKeyword, EVENTS } from '@builderbot/bot';
import { logger, emailLogger } from '../logger/logger.js';
import axios from "axios";
import { setClienteData } from "../models/clienteDATA.js";
import fs from "fs";
import { findCustomer } from "../services/dataclientes/clienteService.js";
import { Console } from "console";

function generarRequestId(dni) {
  const fecha = new Date();
  const formatoFechaHora = 
      String(fecha.getDate()).padStart(2, '0') + // Día (dd)
      String(fecha.getMonth() + 1).padStart(2, '0') + // Mes (MM)
      fecha.getFullYear() + // Año (yyyy)
      String(fecha.getHours()).padStart(2, '0') + // Hora (HH)
      String(fecha.getMinutes()).padStart(2, '0') + // Minutos (mm)
      String(fecha.getSeconds()).padStart(2, '0'); // Segundos (ss)
  
  return `${dni}-${formatoFechaHora}`; // DNI-FechaHora
}

// Función para procesar la venta
async function procesarVenta(cliente,state) {
  const dni = cliente.documento; // DNI del cliente

  // Asignar el request_id usando el DNI y la fecha
  const requestId = generarRequestId(dni); // Generar request_id con formato DNI-fechaHora
  const venta  = state.get("venta");

  ///const importeCompra  = venta.importeCompra;


  const compraQREstatico = {
      tipo_user_id: 9,
      tipo_user: "APP_QR",
      request_id: requestId, 
      documento: dni,
      plastico: cliente.plastico.replace(/\s+/g, '').trim(),
      vtoplastico: "1024",
      cuitcomercio: venta.comercio.puntos[0].cuitxpto,
      empresa: venta.numeroComercio,
      puntovta: 1,
      numcaja: 1,
      total: venta.importeCompra,
      planvta: 1,
      cuotasvta: 1,
      fecha: new Date().toISOString(),
      observacionvta: "API_REST_34_APPMOVILE_QR",
      token: "",
  };
  console.log('JSON DE LA COMPTRA > :', compraQREstatico);

  try {
      
      const response = await axios.post('http://200.70.56.203:8021/AppMovil/ApiComercioVenta', compraQREstatico, {
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
          }
      });

      console.log('Venta procesada xd:', response.data);
      return response.data;
  } catch (error) {
      console.error('Error al procesar la venta sad :', error);
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
        console.log("entre a findcomercio")
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
        //console.log("Respuesta completa del servidor:", response);
        //console.log("Datos del comercio obtenidos:", response.data);
        
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

const flowPagarCompras = addKeyword("COMPRA","COMPRAR" , {sensitive : false})
  .addAnswer(".",
    { capture: false },
      async (ctx, { flowDynamic ,state}) => {
        state.clear();
        const cliente = await findCustomer(ctx);
        //console.log("Datos del cliente obtenidos al inicio del flujo:", cliente);

        if (Object.keys(cliente).length > 0){
          //await state.update({ customer:cliente });
          return flowDynamic([{ body: `Recuerda que tu disponible para compras actual es de: ${cliente.disponible}` }]);
        }else {
          return flowDynamic(".");
        }
      }
  )
  .addAnswer(
    "Para continuar *¿Me podrías proporcionar numero de comercio, por favor? Solo numeros (ej. 45000)* ",
    { capture: true },
     async (ctx, { fallBack, flowDynamic, state }) => {
        try{  
            const comercioRegex = /^\d{1,6}$/;
            console.log("Número de comercio recibido: ", ctx.body);
            if (comercioRegex.test(ctx.body)) {
                flowDynamic([{ body: "Aguarda un instante.. estoy obteniendo los datos del comercio...!!!" }]);
                const comercio = await findComercio(ctx.body);                                
                if (comercio) {
                  const infoVenta = {};
                  infoVenta.comercio = comercio;
                  infoVenta.importeCompra =  0 ;
                  infoVenta.numeroComercio =  ctx.body ;
                  await state.update({ venta:infoVenta });
                    //const cliente = state.getMyState().cliente;
                    //cliente.comercioRazonSocial = comercio.puntos[0].descrpto || "No especificado";
                    //cliente.comercioNumero = ctx.body;
                    //cliente.comercio = comercio;
                      
                    //console.log("Cliente después de actualizar datos:", cliente);
                    return await flowDynamic([{ body: "*Estas por realizar compra en : " + infoVenta.comercio.puntos[0].descrpto + "*" }]);
                }else {                    
                    console.log("Comercio no encontrado en la base de datos");
                    return fallBack("Numero de comercio : "+ctx.body+" no encontrado en nuestras base de datos !!!!");    
                }       
                
            } else {
                console.log("Número de comercio no válido: ", ctx.body);
                return fallBack("El numero de comercio ("+ctx.body+") no es válido !!! Reingresalo.");
            }
        }catch(error){
            console.log("Error al buscar el comercio: ", error.stack);
            emailLogger.error(error.stack);
            logger.error(error.stack);
        }
      }
  )
  .addAnswer(
    ".... ",
    { capture: false },
    async (ctx, { flowDynamic, state }) => {
      const venta = await state.get("venta");
      console.log("venta.importeCompra       :", venta.importeCompra);
      console.log("venta.comercio.personalid :", venta.comercio.personalid);
      await flowDynamic([{ body: "*Estas por realizar compra en :" + venta.comercio.puntos[0].descrpto + "*"}]);
    }
  )  
  .addAnswer(
    "Para continuar *¿Me podrías proporcionar el importe de la compra (ejemplo: 1000.00 ), por favor?*",
    { capture: true },
    async (ctx, { fallBack, state }) => {
        const importeRegex = /^\d+(\.\d+)?$/;

        if (importeRegex.test(ctx.body)) {
          const cliente = await findCustomer(ctx);
          await state.update({ importeCompra: parseFloat(ctx.body)});  
        } else {
            return fallBack(
              "*El importe ingresado "+ctx.body+ " no es valido por favor .. reingresalo (ejemplo: 1000.00 )*."
            );
        }
      }
  )
  .addAnswer(
    "*Por favor reingresa el importe para continuar con la operacion.*",
    { capture: true },
    async (ctx, { fallBack, state }) => {
        const importeRegex = /^\d+(\.\d+)?$/;
        if (importeRegex.test(ctx.body)) {
          const importeCompraFirst = state.getMyState().importeCompra;
          console.log("Cliente al verificar el importe reingresado:", importeCompraFirst);
            if (importeCompraFirst != parseFloat(ctx.body)){
                return fallBack(
                  "*El importe ingresado  "+ctx.body+ " no es coincide con el importe ingresado previamente*."
                );  
            }
        } else {
            return fallBack(
              "*El importe ingresado  "+ctx.body+ " no es valido por favor .. reingresalo (ejemplo: 1000.00 )*."
            );
        }
      }
  )

  .addAnswer(
    "Validando datos ingresados... ..",
    { capture: false },
    async (ctx, { flowDynamic, endFlow, state }) => {
        try{
            const venta = state.get("venta");
            console.log("venta.comercio.puntos[0].descrpto"+venta.comercio.puntos[0].descrpto);
            console.log("venta.importeCompra" + venta.importeCompra);
            if (true ){
              flowDynamic([
                { body: "*CONFIRMAS COMPRA EN "+venta.comercio.puntos[0].descrpto+" POR UN IMPORTE DE "+venta.importeCompra + " EN PLAN D ?*" },
                //{ body: "*Para confirmar operacion ingresa tu numero de DNI....*" }
              ]);   
            }else {
                return endFlow("*001 - OCURRIO UN ERROR PROCESANDO LA OPERACION REINTENTA LUEGO .... !! MUCHAS GRACIAS ");
            }
        }catch(error){    
            emailLogger.error(error.stack);
            logger.error(error.stack);
            return endFlow("*OCURRIO UN ERROR PROCESANDO LA OPERACION REINTENTA LUEGO .... !! MUCHAS GRACIAS ");
        }                    
    }
  )
  .addAnswer(
    "*Para confirmar operacion ingresa tu numero de DNI....*",
    { capture: true },
    async (ctx, { fallBack, endFlow, flowDynamic, state }) => {
        try{
          let cantidadIntentos= 1;
          const dniRegex = /^\d{1,8}$/;
          if (dniRegex.test(ctx.body)) {                          
            const dniIngresado = parseInt(ctx.body);
            
            const cliente = await findCustomer(ctx);
            console.log("Datos del cliente al validar DNI:", cliente.documento + " == " + dniIngresado );

            if ( dniIngresado == cliente.documento){
                procesarVenta(cliente,state);

               const transactionId = "123456";
                await flowDynamic([
                  {
                  body: "*Operación exitosa. El número de transacción es  N°: "+ transactionId + "*" ,
                  media: "https://i.postimg.cc/GmLjpD8M/descarga.png",
                  },
                ]);    
                state.clear();
                return endFlow("*MUCHAS GRACIAS.TENES SUERTE ..TENES DATA !!!* ");
                  
            }else {
                if (cantidadIntentos < 3 ){
                  return fallBack("*EL NUMERO INGRESADO NO COINCIDE CON NUESTROS REGISTROS, REINGRESA EL NMUMERO DE DNI...!!!* ");
                }else {
                  emailLogger.error("INTENTO DE COMPRA QUE SUPERO LA CANTIDAD DE INGRESOS DE DNI : "+ ctx.body + " EN EL CLIENTE DESDE EL TELEFONO : " + ctx.from  );
                  return endFlow("*EL NUMERO DE DNI INGRESADO NO COINCIDE CON NUESTROS REGISTROS Y SUPERASTE LA CANTIDAD DE REINTENTOS...EL PROCESO SE CANCELARA !!!* ");
                }
              cantidadIntentos++;
            }
          }else {
            return fallBack("*EL NUMERO INGRESADO NO ES VALIDO , SOLO SE ACEPTAN NUMEROS.. (Ej: 22159357) !!!* ");
          }
        }catch(error){
            emailLogger.error(error.stack);
            logger.error(error.stack);
            return endFlow("*OCURRIO UN ERROR PROCESANDO LA OPERACION REINTENTA LUEGO .... !! MUCHAS GRACIAS ");
        }        
    }
);

export default flowPagarCompras;
