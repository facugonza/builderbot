//import dotenv from "dotenv";
//dotenv.config();

import { addKeyword } from '@builderbot/bot';
import { setClienteData } from "../models/clienteDATA.js";
import { findCustomer } from "../services/dataclientes/clienteService.js";
import axios from "axios";


const desvincularCuenta = async (datosCliente) => {
    console.log(" desvincularCuenta : " + datosCliente.dni + "/ "+ datosCliente.numeroTelefono ) ;
    try {
      var config = {
        method: "POST",
        url: "http://200.70.56.203:8021/AppMovil/DesvincularCliente",
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify(datosCliente),
      };
  
      const response = await axios(config);
      return response.data;
    } catch (e) {
      console.log("ERROR desvincularCuenta : " +e);
      return null;
    }
  };
  

  const flowDesvincular = addKeyword("desvincular", { sensitive: false })
  .addAnswer(
    "⚠️ *¿Confirmas desvincular este número de teléfono de la cuenta?*\nResponde *SI* o *NO* para confirmar o cancelar.",
    { capture: true },
    async (ctx, { endFlow, flowDynamic }) => {
      const cliente = await findCustomer(ctx);

      if (Object.keys(cliente).length > 0) {
        if (ctx.body.toLowerCase() === "si") {
          const datosCliente = {};
          datosCliente.numeroTelefono = ctx.from;
          datosCliente.dni = cliente.documento;

          const desvincularCliente = await desvincularCuenta(datosCliente);
          setClienteData(ctx, {});

          if (desvincularCliente != null && desvincularCliente.success) {
            return endFlow(
              `✅ *Desvinculamos este número (+${ctx.from})* del cliente: *${cliente.apellido} ${cliente.nombre}*.\n¡Gracias por usar nuestro servicio!`
            );
          } else {
            return flowDynamic(
              "❌ *No se pudo procesar la solicitud en este momento.* Por favor, reintenta más tarde. 🙏"
            );
          }
        } else {
          setClienteData(ctx, {});
          return endFlow(
            "🚫 *OPERACIÓN CANCELADA.*\nSi tienes más preguntas o necesitas ayuda, no dudes en contactarme nuevamente.\n*¡Tenés suerte... tenés DATA!* 🎉"
          );
        }
      }
    }
  );

export default flowDesvincular;
