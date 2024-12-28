import { addKeyword } from '@builderbot/bot';
import { getClienteData, setClienteData } from "../models/clienteDATA.js";
import { logger, emailLogger } from '../logger/logger.js';
//import createPaymentLink from "../linkpago/mercadopago.js";
import { findCustomer } from "../services/dataclientes/clienteService.js";
import databaseLogger from '../logger/databaseLogger.js';
import acciones from '../models/acciones.js';


function extractImportFromBarCode(barcode) {
    if (barcode) {
        const importPart = barcode.slice(-10, -2);
        logger.info(importPart);
        return parseFloat(importPart) / 100;
    } else {
        logger.error("Barcode is undefined or null");
        return null; // Otra acción adecuada en caso de que barcode sea indefinido o nulo
    }
}
const generatePayLinkVisa = async (amount,description,indentifier) => {
    // Crear el cuerpo del payload como un objeto válido
    const datosPago = {
      collector_cuit: "20322678275",
      collector_branchOffice: "3242",
      description: "Pago de Tarjeta DATA-VISA",
      totalAmount: amount, // Usamos el monto dinámico recibido como parámetro
      currency: "ARS",
      channel: 2,
      //expirationDate: "2025-11-09T15:20:00.0000000", // Fecha de expiración
      //successUrl: "https://home.tarjetadata.com.ar/", // URL en caso de éxito
      //errorUrl: "https://home.tarjetadata.com.ar/error", // URL en caso de error
      clientReference: indentifier, // Referencia única del cliente
      items: [
        {
          amount: amount.toFixed(2), // Convertimos el monto a string con 2 decimales
          description: description,
          quantity: "1", // Cantidad fija
        },
      ],
    };
  
    try {
      const config = {
        method: "POST",
        url: "https://pruebas.tarjetadata.com.ar/restbind/servicios/bind/boton/simple/pago",
        headers: {
          "Content-Type": "application/json",
          "Idaplicacion": "4", // ID de la aplicación (CHATBOT-VISA-DATA)
        },
        data: JSON.stringify(datosPago), // Serializamos el cuerpo del payload
      };
  
      // Realizar la solicitud a la API
      const response = await axios(config);
  
      // Validar y retornar la respuesta
      if (response.data?.url) {
        console.log("Link generado correctamente:", response.data.url);
        return response.data.url;
      } else {
        console.error("Error en la respuesta de la API:", response.data);
        return null;
      }
    } catch (error) {
      console.error("Error generando el link de pago VISA:", error.message);
      if (error.response) {
        console.error("Detalles del error:", error.response.data);
      }
      return null;
    }
  };
  
  
function formatFechaResumen(dateString) {
    return dateString.replace(/\/\//g, '-');
}

const flowLinkPagoMP = addKeyword("pagar", {sensitive : false})
.addAnswer(".", {delay : 1000},
  async(ctx,{endFlow,flowDynamic} ) => {
    
    databaseLogger.addLog(
        ctx.from,
        acciones.PAGAR
    );
  
    const cliente = await findCustomer(ctx);
     
    if (Object.keys(cliente).length > 0){
        try{
            const messages = [];
            const fechaResumen = cliente.resumenfecha ; //formatFechaResumen(cliente.resumenfecha);
            await flowDynamic([{ body: "⏳ *Aguarda un instante... generando tus links de pagos para resumen con vto "+fechaResumen+"....!!!*" }]);
            logger.info("*************************************");
            logger.info("Cliente > " + cliente);
            logger.info("*************************************");
            if(cliente.barcodepland !== ""){
                const pagoPlanD = extractImportFromBarCode(cliente.barcodepland);
                if (pagoPlanD>0){                
                    const itemTitlePlanD = `Tarjeta DATA - Pago Plan D de resumen con vencimiento: ${fechaResumen} del cliente ${cliente.apellido}  ${cliente.nombre}`;                
                    //const linkBarcodePland = await createPaymentLink(itemTitlePlanD, pagoPlanD,cliente.documento,"02",cliente.barcodepland);
                    const linkBarcodePland = "https://pagos.asjservicios.com.ar:8092/?E=7963&B="+cliente.barcodepland;
                    messages.push({ body: `🔗 *Abre este enlace para el pago Plan D $ ${pagoPlanD} >* ${linkBarcodePland}` });
                }
            }

            if(cliente.barcodeminimo !== ""){
                const pagoMinimo = extractImportFromBarCode(cliente.barcodeminimo);
                if (pagoMinimo>0){
                    const itemTitleMinimo = `Tarjeta DATA - Pago Minimo de resumen con vencimiento: ${fechaResumen} del cliente ${cliente.apellido}  ${cliente.nombre}`;                
                    //const linkBarcodeMinimo = await createPaymentLink(itemTitleMinimo, pagoMinimo,cliente.documento,"03",cliente.barcodeminimo);
                    const linkBarcodeMinimo = "https://pagos.asjservicios.com.ar:8092/?E=7963&B="+cliente.barcodeminimo;
                    messages.push({ body: `🔗 *Abre este enlace para el pago Minimo $ ${pagoMinimo} >* ${linkBarcodeMinimo}` });
                }
            }

            if(cliente.barcodetotal !== ""){
                const pagoTotal = extractImportFromBarCode(cliente.barcodetotal);
                if (pagoTotal>0){
                    const itemTitleTotal = `Tarjeta DATA - Pago Total de resumen con vencimiento: ${fechaResumen} del cliente ${cliente.apellido}  ${cliente.nombre}`;                
                    //const linkBarcodeTotal = await createPaymentLink(itemTitleTotal, pagoTotal,cliente.documento,"01",cliente.barcodetotal);
                    const linkBarcodeTotal = "https://pagos.asjservicios.com.ar:8092/?E=7963&B="+cliente.barcodetotal;
                    messages.push({ body: `🔗 *Abre este enlace para el pago Total $ ${pagoTotal} >* ${linkBarcodeTotal}` });
                }
            }

            if(messages.length > 0){
                await flowDynamic(messages);  
            } else {
                await flowDynamic([{ body: "📭 *No tienes pagos pendientes en este momento.*" }]);
            }

            if (cliente.hasVisaSummaryLinkPäy){
                const messagesVISALinkPays = [];  

                if (cliente.minvisaamonut){
                    const payLinkMin   = generatePayLinkVisa(cliente.minvisaamonut,"Pago Minimo DATA VISA",cliente.minvisaamonutidentifier);        
                    messagesVISALinkPays.push({ body: `🔗 *Abre este enlace para el PAGO MINIMO de Tarjeta DATA VISA $ ${cliente.minvisaamonut} >* ${payLinkMin}` });
                }
                if (cliente.totalvisaamonut){
                    const payLinkTotal =  generatePayLinkVisa(cliente.totalvisaamonut,"Pago Total DATA VISA",cliente.totalvisaamonutidentifier);     
                    messagesVISALinkPays.push({ body: `🔗 *Abre este enlace para el PAGO TOTAL de Tarjeta DATA VISA $ ${cliente.totalvisaamonut} >* ${payLinkTotal}` });
                }                
                if(messagesVISA.length > 0){
                    await flowDynamic({ body: `🔗 *Estos son los links de pago para Tarjeta DATA VISA:*` });
                    await flowDynamic(messagesVISALinkPays);  
                }
            }

            setClienteData(ctx,{});
            return endFlow("✅ Si tienes más preguntas o necesitas ayuda, no dudes en contactarme nuevamente. *Tenes suerte .. Tenes DATA !!*");
        }catch(error){
            logger.error(error);
            emailLogger.error(error);
        }
    }
  }
);

export default flowLinkPagoMP; 