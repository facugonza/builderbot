import { addKeyword } from '@builderbot/bot';
import { setClienteData } from "../models/clienteDATA.js";
import { findCustomer } from "../services/dataclientes/clienteService.js";

import databaseLogger from '../logger/databaseLogger.js';
import acciones from '../models/acciones.js';



const flowResumen = addKeyword("resumen", { sensitive: false })
  .addAnswer(
    ".",
    { delay: 500 },
    async (ctx, { endFlow, flowDynamic }) => {
      databaseLogger.addLog(ctx.from, acciones.RESUMEN);

      const cliente = await findCustomer(ctx);

      if (Object.keys(cliente).length > 0) {
        try {
          await flowDynamic([
            {
              body: `📄 *Obteniendo tu último resumen DATA generado con vencimiento ${cliente.resumenfecha}.* ⏳ *Aguarda unos instantes...*`,
            },
          ]);

          const resumenURL = `https://seguro.tarjetadata.com.ar/ResumenImpresionREST/webresources/impresionResumen/generarResumenPDF/${cliente.resumennumero}`;
          await flowDynamic([
            {
              body: `📑 *Resumen N° ${cliente.resumennumero}*`,
              media: resumenURL,
            },
          ]);

          if (cliente.hasVisaSummary) {
            await flowDynamic([
              {
                body: `💳 *Obteniendo tu último resumen VISA generado para el cliente: ${cliente.apellido}.* ⏳ *Aguarda unos instantes...*`,
              },
            ]);

            const resumenVISA = `https://seguro.tarjetadata.com.ar/ServiciosDataVisaREST/webresources/resumen/visa/download/numerodocumento/${cliente.documento}`;
            await flowDynamic([
              {
                body: `📑 *Resumen VISA N° ${cliente.documento}*`,
                media: resumenVISA,
              },
            ]);
          }
        } catch (error) {
          await flowDynamic([
            {
              body: `❌ *En estos momentos no puedo procesar la opción solicitada.* Por favor, *reintenta más tarde.*`,
            },
          ]);
          console.log(error);
        }

        setClienteData(ctx, {});
        return endFlow(
          "✅ *Si tienes más preguntas o necesitas ayuda, no dudes en contactarme nuevamente.*\n🎉 *¡Tenés suerte... tenés DATA!*"
        );
      } else {
        console.log("FUI POR EL ELSE " + Object.keys(cliente).length);
      }
    }
  );

export default flowResumen;