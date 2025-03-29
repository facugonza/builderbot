import { addKeyword } from '@builderbot/bot';
import { findCustomer } from "../services/dataclientes/clienteService.js";
import { getClienteData, setClienteData } from "../models/clienteDATA.js";
import { logger, emailLogger } from '../logger/logger.js';
import axios from "axios";
import acciones from '../models/acciones.js';
import databaseLogger from '../logger/databaseLogger.js';

import dotenv from 'dotenv';
dotenv.config();

// 🔹 Función interna para llamar al servlet de VISA
const getVisaResumen = async (dni,nombre) => {
    try {
      const url = `http://200.70.56.203:8021/AppMovil/ServiceVisaController?dni=${dni}&cliente=${nombre}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      emailLogger.error("Error al obtener resumen VISA:", error);
      return null;
    }
};


const flowPagarV = addKeyword("PAGARV", { sensitive: false })
  .addAction( { delay: 1000 }, async (ctx, { flowDynamic, endFlow }) => {
    
    databaseLogger.addLog(ctx.from, acciones.PAGARVISA);

    const cliente = await findCustomer(ctx);

    if (!cliente || Object.keys(cliente).length === 0) {
      return endFlow("❌ No se encontró información del cliente.");
    }

    try {
      const data = await getVisaResumen(cliente.documento,cliente.nombre);  

      if (data && data.hasVisaSummaryLinkPay) {
        const messages = [];

        if (data.minvisalinkpay && data.minvisaamount) {
          messages.push({
            body: `🔗 *Abre este enlace para el PAGO MÍNIMO de Tarjeta DATA VISA ($${data.minvisaamount}):*\n${data.minvisalinkpay}`
          });
        }

        if (data.totalvisalinkpay && data.totalvisaamount) {
          messages.push({
            body: `🔗 *Abre este enlace para el PAGO TOTAL de Tarjeta DATA VISA ($${data.totalvisaamount}):*\n${data.totalvisalinkpay}`
          });
        }

        if (messages.length > 0) {
          await flowDynamic([
            { body: "🔗 *Estos son tus links de pago para Tarjeta DATA VISA:*" },
            ...messages
          ]);
        } else {
          await flowDynamic([{ body: "📭 *No encontramos deuda activa en tu Tarjeta DATA VISA.*" }]);
        }
   
        setClienteData(ctx, {});
        return endFlow("✅ ¡Listo! Si necesitás algo más, escribime. *Tenés suerte... Tenés DATA!*");

      } else {
        return endFlow("📭 *No tenés resumen activo en tu Tarjeta VISA.*");
      }

    } catch (error) {
      logger.error("Error VISA:", error);
      emailLogger.error("Error VISA:", error);
      return endFlow("❌ Ocurrió un error procesando el pago VISA. Intentá más tarde.");
    }
  });

export default flowPagarV;
