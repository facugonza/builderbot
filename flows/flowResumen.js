import { addKeyword } from '@builderbot/bot';
import { setClienteData } from "../models/clienteDATA.js";
import { findCustomer } from "../services/dataclientes/clienteService.js";

import databaseLogger from '../logger/databaseLogger.js';
import acciones from '../models/acciones.js';



const flowResumen = addKeyword("resumen",{sensitive : false})
.addAnswer(".",
    {delay:500},
    async (ctx, { endFlow,flowDynamic }) => {   
        
        databaseLogger.addLog(
            ctx.from,
            acciones.RESUMEN
        );

        const cliente = await findCustomer(ctx);        
        
        if (Object.keys(cliente).length > 0){
            try{
                if (cliente.resumennumero)  {

                    flowDynamic([{body: "📄 Obteniendo tu ultimo resumen DATA generado con vencimiento "+cliente.resumenfecha+". *Aguarda unos instantes...*"}]);    
                    
                    //const resumenURL = 'http://200.70.56.202:8080/ResumenOnLine2/ResumenOnLine?tipodocu=3&nrodocu='+ cliente.documento;
                    const resumenURL = 'https://seguro.tarjetadata.com.ar/ResumenImpresionREST/webresources/impresionResumen/generarResumenPDF/'+ cliente.resumennumero;
                    
                    //const resumenURL = 'http://200.70.56.202:8180/ResumenImpresionREST/webresources/impresionResumen/generarResumenPDF/'+ cliente.resumennumero;
                    await flowDynamic([
                        {
                        body: "📄 Resumen N° " + cliente.resumennumero,
                        media: resumenURL,
                        },
                        //{
                        //body :"Si tienes más preguntas o necesitas ayuda, no dudes en contactarme nuevamente. *Tenes suerte .. Tenes DATA !!*"    
                        //},
                    ]);   
                }else {
                    flowDynamic([{body: "📄 *Error Obteniendo tu ultimo resumen, intenta mas tarde ..*"}]);                        
                }
                if (cliente.hasVisaSummary){
                    flowDynamic([{body: "💳 Obteniendo tu ultimo resumen VISA generado con vencimiento para el cliente : "+cliente.apellido+". *Aguarda unos instantes...*"}]);    
                    //const resumenVISA = 'http://200.70.56.202:8180/ServiciosDataVisaREST/webresources/resumen/visa/download/numerodocumento/'+ cliente.documento;                
                    const resumenVISA = 'https://seguro.tarjetadata.com.ar/ServiciosDataVisaREST/webresources/resumen/visa/download/numerodocumento/'+ cliente.documento;                
                    await flowDynamic([
                        {
                        body: "📑 Resumen N° " + cliente.documento,
                        media: resumenVISA,
                        },
                    ]);                     
                }

            }catch(error){
                flowDynamic([{body: "❌ En estos momentos no puedo procesar la opcion solicitada .. *reintenta mas tarde*"}]);    
                console.log(error);
            }
            setClienteData(ctx,{});
            return endFlow("✅ Si tienes más preguntas o necesitas ayuda, no dudes en contactarme nuevamente. *Tenes suerte .. Tenes DATA !!*");
        }else {
            console.log("FUI POR EL ELSE " + Object.keys(cliente).length );
        }
    }
);

export default  flowResumen;