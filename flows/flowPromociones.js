import { addKeyword } from '@builderbot/bot';
import { setClienteData } from "../models/clienteDATA.js";
import GoogleSheetService from '../services/promos/index.js'; // Ajusta la ruta según sea necesario
import { logger, emailLogger } from '../logger/logger.js';
import databaseLogger from '../logger/databaseLogger.js';
import acciones from '../models/acciones.js';

const flowPromociones = addKeyword("promo")
.addAnswer("🎉*Te comparto nuestras Promociones vigentes:*", { delay: 1000 }, async (ctx, { endFlow, flowDynamic }) => {
  try {
    databaseLogger.addLog(
      ctx.from,
      acciones.PROMOS
    );

    const googleSheetService = new GoogleSheetService('1HFkLo5FWmGBgpkT2nFDotjwl9E2ZQcBhCcdoh_DkWd8');
    const activePromos = await googleSheetService.retriveActivePromos();

    if (activePromos && activePromos.length > 0) {
      const formattedPromos = activePromos.map(promo => ({
        body: `🎁 *${promo.name} : ${promo.description} -* \n 📅 *– Vigencia desde ${promo.startDate} al ${promo.endDate}.*`,
        media: promo.image // Asegúrate de que tus datos de promoción incluyan una URL de imagen
      }));
      await flowDynamic(formattedPromos);
    } else {
      await flowDynamic([{ body: "📭 *Actualmente no hay promociones activas.*" }]);
    }

    setClienteData(ctx, {});
    return endFlow("✅ Si tienes más preguntas o necesitas ayuda, no dudes en contactarme nuevamente. *Tenes suerte .. Tenes DATA !!*");
  } catch (error) {
    logger.error("ERROR flowPromociones > " + error.stack );
    emailLogger.error("ERROR flowPromociones > " + error.stack );
  }
});

export default  flowPromociones;