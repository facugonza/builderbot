//import dotenv from "dotenv";
//dotenv.config();

import { addKeyword, EVENTS } from '@builderbot/bot';
import axios from "axios";
import databaseLogger from '../logger/databaseLogger.js';
import acciones from '../models/acciones.js';


const asociarCliente = async (datosCliente) => {
  try {
    console.log ("asociarCliente DATOS : "  + JSON.stringify(datosCliente))    
    databaseLogger.addLog(
      datosCliente.numeroTelefono,
      acciones.VINCULAR
    );
    var config = {
      method: "POST",
      url: "http://200.70.56.203:8021/AppMovil/ValidarCliente",
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify(datosCliente),
    };

    const response = await axios(config);
    return response.data;
  } catch (e) {
    console.log("asociarCliente > ERROR : >  "+e );
    return null;
  }
};


const flowValidarCliente = addKeyword("cliente", { sensitive: false })
  .addAnswer(
    ["👋 ¡Claro! Antes de continuar, necesito validar tu DNI. ¿Me podrías proporcionar tu número de DNI, por favor?"],
    { capture: true },
    async (ctx, { fallBack, state }) => {
      state.clear();
      console.log("flowValidarCliente > DNI: " + ctx.body);
      const importeRegex = /^\d+$/;
      if (importeRegex.test(ctx.body)) {
        console.log("flowValidarCliente > DNI validado.");
        await state.update({ dni: ctx.body, numeroTelefono: ctx.from });
      } else {
        return fallBack("⚠️ *¿Puedes verificar el número ingresado?* Gracias.");
      }
    }
  )
  .addAnswer(
    "📅 ¡Perfecto! ¿Me podrías proporcionar tu fecha de nacimiento, por favor? *(DD/MM/YYYY)*",
    { capture: true },
    async (ctx, { fallBack, state }) => {
      console.log("flowValidarCliente > NACIMIENTO: " + ctx.body);
      const fechaNacimientoRegex = /^(0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.](19|20)\d\d$/;
      if (fechaNacimientoRegex.test(ctx.body)) {
        await state.update({ fechaNacimiento: ctx.body });
      } else {
        return fallBack(
          "⚠️ *¿Puedes verificar la fecha ingresada?* Ejemplo: *01/09/1990*. Gracias."
        );
      }
    }
  )
  .addAnswer(
    "💳 ¡Casi terminamos! Por último, ¿me podrías proporcionar los últimos 4 dígitos de tu Tarjeta DATA, por favor? *(####)*",
    { capture: true },
    async (ctx, { fallBack, state }) => {
      console.log("flowValidarCliente > 4 DIGITOS: " + ctx.body);
      const ultimosCuatroDigitosRegex = /^\d{4}$/;
      if (ultimosCuatroDigitosRegex.test(ctx.body)) {
        await state.update({ ultimosCuatroDigitos: ctx.body });
      } else {
        return fallBack(
          "⚠️ *¿Puedes verificar los dígitos ingresados?* Ejemplo: *1234*. Gracias."
        );
      }
    }
  )
  .addAnswer(
    "⏳ *Muchas gracias! Aguarda un instante, por favor... Estoy validando tus datos.*",
    { capture: false },
    async (ctx, { flowDynamic, endFlow, state }) => {
      const cliente = await asociarCliente(state.getMyState());
      console.log("flowValidarCliente último addAnswer: " + cliente);
      if (cliente != null && cliente.isLogin) {
        await flowDynamic([
          {
            body: `🎉 *¡Felicitaciones! Asociamos este número (+${ctx.from}) de teléfono al cliente: ${cliente.apellido} ${cliente.nombre}.*\n💡 *¡Tenés suerte... tenés DATA!*`,
          },
        ]);
        return endFlow(
          "✅ *Muchas gracias por registrarte. Por favor, envía un mensaje nuevamente para iniciar como cliente registrado.*"
        );
      } else {
        return endFlow(
          "❌ *La información proporcionada no coincide con ninguno de nuestros registros. Por favor, verifica los datos e inténtalo nuevamente.*"
        );
      }
    }
  );

export default flowValidarCliente;