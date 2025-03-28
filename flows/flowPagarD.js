import { addKeyword } from '@builderbot/bot';
import { findCustomer } from "../services/dataclientes/clienteService.js";
import { logger, emailLogger } from '../logger/logger.js';
import { setClienteData } from "../models/clienteDATA.js";
import acciones from '../models/acciones.js';
import databaseLogger from '../logger/databaseLogger.js';

function extractImportFromBarCode(barcode) {
  if (barcode) {
    const importPart = barcode.slice(-10, -2);
    logger.info(importPart);
    return parseFloat(importPart) / 100;
  }
  return null;
}

const flowPagarD = addKeyword("PAGARD", { sensitive: false })
  .addAction( { delay: 1000 }, async (ctx, { flowDynamic, endFlow }) => {
    databaseLogger.addLog(ctx.from, acciones.PAGARDATA);

    const cliente = await findCustomer(ctx);

    try {
      const messages = [];
      const fechaResumen = cliente.resumenfecha;

      await flowDynamic([
        {
          body: `⏳ *Aguarda un instante, estoy generando tus links de pagos para *Tarjeta DATA* con vto ${fechaResumen}.*`,
        },
      ]);

      if (cliente.barcodepland !== "") {
        const pagoPlanD = extractImportFromBarCode(cliente.barcodepland);
        if (pagoPlanD > 0) {
          const link = `https://pagos.asjservicios.com.ar:8092/?E=7963&B=${cliente.barcodepland}`;
          messages.push({ body: `🔗 *Pago Plan D $ ${pagoPlanD} >* ${link}` });
        }
      }

      if (cliente.barcodeminimo !== "") {
        const pagoMin = extractImportFromBarCode(cliente.barcodeminimo);
        if (pagoMin > 0) {
          const link = `https://pagos.asjservicios.com.ar:8092/?E=7963&B=${cliente.barcodeminimo}`;
          messages.push({ body: `🔗 *Pago Mínimo $ ${pagoMin} >* ${link}` });
        }
      }

      if (cliente.barcodetotal !== "") {
        const pagoTotal = extractImportFromBarCode(cliente.barcodetotal);
        if (pagoTotal > 0) {
          const link = `https://pagos.asjservicios.com.ar:8092/?E=7963&B=${cliente.barcodetotal}`;
          messages.push({ body: `🔗 *Pago Total $ ${pagoTotal} >* ${link}` });
        }
      }

      if (messages.length > 0) {
        await flowDynamic(messages);
      } else {
        await flowDynamic([{ body: "📭 *No tenés pagos pendientes con Tarjeta DATA.*" }]);
      }

      setClienteData(ctx, {});
      return endFlow("✅ ¡Listo! *Tenés suerte... Tenés DATA!*");

    } catch (error) {
      logger.error(error);
      emailLogger.error(error);
      return endFlow("❌ *Ocurrió un error generando los links. Intentá más tarde.*");
    }
  });

export default flowPagarD;
