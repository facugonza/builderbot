import { addKeyword } from '@builderbot/bot';
import { findCustomer } from "../services/dataclientes/clienteService.js";
import databaseLogger from '../logger/databaseLogger.js';
import acciones from '../models/acciones.js';
import flowPagarD from './flowPagarD.js';
import flowPagarV from './flowPagarV.js';

const flowLinkPagoMP = addKeyword("pagar", { sensitive: false })
  .addAnswer(".", { delay: 1000 }, async (ctx, { flowDynamic, endFlow, gotoFlow }) => {
    databaseLogger.addLog(ctx.from, acciones.PAGAR);

    const cliente = await findCustomer(ctx);

    if (!cliente || Object.keys(cliente).length === 0) {
      return endFlow("❌ No se encontró información del cliente.");
    }

    if (cliente.hasVisaSummary) {
      await flowDynamic([
        {
          body: "Genial! ¿Qué tarjeta querés pagar?\n👉 Escribí *PAGARD* para Tarjeta DATA\n👉 Escribí *PAGARV* para Tarjeta VISA",
        },
      ]);
      return; 
    }

    
    return gotoFlow(flowPagarD);
  })

  
  .addAnswer(null, { capture: true }, async (ctx, { gotoFlow, fallBack }) => {
    const opcion = ctx.body.trim().toLowerCase();
    
    if (opcion === "pagard") {      
      return gotoFlow(flowPagarD);
    }

    if (opcion === "pagarv") {
      return gotoFlow(flowPagarV);
    }

    return fallBack("⚠️ Opción inválida. Escribí *PAGARD* o *PAGARV* para continuar.");
  });

export default flowLinkPagoMP;


/*.addAnswer(".", {delay : 1000},
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
                    const payLinkMin   = cliente.minvisalinkpay;
                    messagesVISALinkPays.push({ body: `🔗 *Abre este enlace para el PAGO MINIMO de Tarjeta DATA VISA $ ${cliente.minvisaamonut} >* ${payLinkMin}` });
                }
                if (cliente.totalvisaamonut){
                    const payLinkTotal =  cliente.totalvisalinkpay;     
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

export default flowLinkPagoMP; */
