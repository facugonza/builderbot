//import dotenv from "dotenv";
//dotenv.config();

import { addKeyword, EVENTS } from '@builderbot/bot';
import { logger, emailLogger } from '../logger/logger.js';
import axios from "axios";
import {setClienteData } from "../models/clienteDATA.js";
//import { downloadMediaMessage } from '@builderbot/provider-baileys'
//import { writeFileSync, readFileSync } from "fs";
import fs from "fs";
import { findCustomer } from "../services/dataclientes/clienteService.js";


async function createDirectoryIfNotExists(directory) {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory);
    }
}
  
function capturarRespuesta(ctx, fallBack, campo) {
    if (!ctx.body) {
      return fallBack();
    }
    comercio[campo] = ctx.body;
}
  
async function findComercio(numeroComercio) {
    try {
        var config = {
          method: "post",
          url: process.env.API_URL_COMERCIO_GET + numeroComercio ,
          headers: {
          },
        };
    
        const response = await axios(config);
        console.log(" COMERCIO > " + response.data );
        return response.data;
      } catch (e) {
        emailLogger.error("ERROR flowMain isRegisterClient > "+ e.stack);
        return null;
      }  
}

async function findCuotasComercio(numeroComercio) {
    try {
      const config = {
        method: "get",
        url: process.env.API_URL_CUOTAS_GET + numeroComercio ,
        headers: {
        },
      };
  
      const response = await axios(config);
      return response.data; // Asumimos que esto retorna un array de objetos, donde cada objeto tiene una propiedad "cuotas" y una propiedad "importe"
    } catch (e) {
      emailLogger.error("ERROR flowMain getCuotasOptions > "+ e.stack);
      return null;
    }  
  }



const flowPagarCompras = addKeyword("COMPRA","COMPRAR" , {sensitive : false})
  .addAnswer(".",
    { capture: false },
      async (ctx, { flowDynamic ,endFlow}) => {
        
        const cliente = await findCustomer(ctx);

        if (Object.keys(cliente).length > 0){
          return flowDynamic([{ body: `Recuerda que tu disponible para compras actual es de: ${cliente.disponible}` }]);
        }else {
          return endFlow(".");
        }
      }
  )
  .addAnswer(
    "Para continuar *¿Me podrías proporcionar numero de comercio, por favor? Solo numeros (ej. 450001)* ",
    { capture: true },
    async (ctx, { fallBack,endFlow ,flowDynamic}) => {
        try{  
            const comercioRegex = /^\d{1,6}$/;
            if (comercioRegex.test(ctx.body)) {                          
                await flowDynamic([{ body: "Aguarda un instante.. estoy obteniendo los datos del comercio...!!!" }]);
                const comercio = await findComercio(ctx.body);                                
                if (comercio && Array.isArray(comercio.puntos) && comercio.puntos.length > 0) {
                    const cliente = await findCustomer(ctx);
                    cliente.comercioRazonSocial = comercio.puntos[0].descrpto;
                    cliente.comercioNumero = ctx.body;
                    cliente.comercio = comercio;
                    await setClienteData(ctx, cliente);  
                    //
                }else {                    
                    return fallBack("Numero de comercio : "+ctx.body+" no encontrado en nuestras base de datos !!!!");    
                }       
                
            } else {
                return fallBack("El numero de comercio ("+ctx.body+") no es válido !!! Reingresalo.");
            }
        }catch(error){
            emailLogger.error(error.stack);
            logger.error(error.stack);
        }
      }
  )
  .addAnswer(
    ".... ",
    { capture: false },
    async (ctx, { flowDynamic }) => {
      const cliente = await findCustomer(ctx);

      return await flowDynamic([{ body: "*Estas por realizar compra en :"+cliente.comercioRazonSocial +"*"}]);
    }
  )  
  .addAnswer(
    "Para continuar *¿Me podrías proporcionar el importe de la compra (ejemplo: 1000.00 ), por favor?*",
    { capture: true },
    async (ctx, { fallBack }) => {
        //const importeRegex = /^(\d*\.)?\d+$/;
        const importeRegex = /^\d+(\.\d+)?$/;

        if (importeRegex.test(ctx.body)) {
          const cliente = await findCustomer(ctx);
            cliente.importeCompra = parseFloat(ctx.body);
            setClienteData(ctx, cliente);  
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
    async (ctx, { fallBack }) => {
        //const importeRegex = /^(\d*\.)?\d+$/;
        const importeRegex = /^\d+(\.\d+)?$/;
        if (importeRegex.test(ctx.body)) {
          const cliente = await findCustomer(ctx);
            if (cliente.importeCompra != parseFloat(ctx.body)){
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
    async (ctx, { flowDynamic,endFlow}) => {
        try{
            //console.log("*****************************************************CONFIRMACION *-********************");
            const clienteDATA = await findCustomer(ctx);
            //console.log("*************************************************************************");    
            //console.log(clienteDATA);
            //console.log("*************************************************************************");     
            if (clienteDATA.comercioRazonSocial && clienteDATA.importeCompra){
              return  flowDynamic([
                { body: "*CONFIRMAS COMPRA EN "+clienteDATA.comercioRazonSocial+" POR UN IMPORTE DE "+clienteDATA.importeCompra + " EN PLAN D ?*" },
                { body: "*Para confirmar operacion ingresa tu numero de DNI....*" }
              ]);   
            }else {
                return endFlow("*OCURRIO UN ERROR PROCESANDO LA OPERACION REINTENTA LUEGO .... !! MUCHAS GRACIAS ");
            }
        }catch(error){    
            emailLogger.error(error.stack);
            logger.error(error.stack);
            return endFlow("*OCURRIO UN ERROR PROCESANDO LA OPERACION REINTENTA LUEGO .... !! MUCHAS GRACIAS ");
        }                    
    }
  )
  .addAnswer(
    "*Aguarda unos instantes.. procesando operacion ... !!!* ",
    { capture: false },
  )
  .addAnswer(
    ".....",
    { capture: true },
    async (ctx, { fallBack,endFlow,flowDynamic }) => {
        try{
          let cantidadIntentos= 1;
          const dniRegex = /^\d{1,8}$/;
          if (dniRegex.test(ctx.body)) {                          
            const dniIngresado = parseInt(ctx.body.toLowerCase());
            
            const cliente = await findCustomer(ctx);

            if ( dniIngresado === cliente.documento){
                const transactionId = "123456"; // suponiendo que obtienes un ID de transacción
                await flowDynamic([
                  {
                  body: "*Operación exitosa. El número de transacción es  N°: "+ transactionId + "*" ,
                  media: "https://i.postimg.cc/GmLjpD8M/descarga.png",
                  },
                ]);    
                setClienteData(ctx,{});
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