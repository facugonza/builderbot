import dotenv from "dotenv";
dotenv.config();

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


const flowValidarCliente = addKeyword("cliente", {sensitive : false})
  .addAnswer(
    ["¡Claro! Antes de continuar, necesito validar DNI. ¿Me podrías proporcionar numero de DNI, por favor?"],
    { capture: true },
    async (ctx, { fallBack ,state }) => {
        state.clear();
        console.log("flowValidarCliente  > DNI :" + ctx.body);
        const importeRegex = /^\d+$/;
        if (importeRegex.test(ctx.body)) {
          console.log("flowValidarCliente  > DNI: ");
          await state.update({dni:ctx.body, numeroTelefono:ctx.from})
        } else {
          return fallBack(
            "¿Puedes Verificar el numero ingresado ? Gracias."
          );
        } 
    
    },
  )
  .addAnswer(
    "¡Perfecto!. ¿Me podrías proporcionar tu fecha de nacimiento, por favor? {DD/MM/YYYY}",
    { capture: true },
    async (ctx, { fallBack ,state}) => {
        console.log("flowValidarCliente  > NACIMIENTO: " + ctx.body);
        const fechaNacimientoRegex = /^(0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.](19|20)\d\d$/;
        if (fechaNacimientoRegex.test(ctx.body)) {
            await state.update({fechaNacimiento:ctx.body})
        } else {
          return fallBack(
            "¿Puedes Verificar la fecha ingresada. *EJ: 01/09/1990*  ? Gracias."
          );
        }  
    }
  )
  .addAnswer(
    "¡Casi Terminamos! por ultimo. ¿Me podrías proporcionar los ultimos 4 digitos de tu Tarjeta DATA, por favor? {####}",
    { capture: true },
    async (ctx, { fallBack ,state}) => {
        console.log("flowValidarCliente  > 4 DIGITOS :" + ctx.body);
        const ultimosCuatroDigitosRegex = /^\d{4}$/;
        if (ultimosCuatroDigitosRegex.test(ctx.body)) {
            await state.update({ultimosCuatroDigitos:ctx.body})
        } else {
          return fallBack(
            "¿Puedes Verificar los digitos ingresados. *EJ: 1234*  ? Gracias."
          );
        }  
    }
  )  
  .addAnswer( "Muchas gracias !! Aguarda un instante por favor ...estoy validando tus datos !!!",
    { capture: false },
    async (ctx, { flowDynamic,endFlow ,state}) => {
      const cliente = await asociarCliente(state.getMyState());
      console.log("flowValidarCliente ultimo addAnswer  : " + cliente);        
      if (cliente!=null && cliente.isLogin){
        await flowDynamic("Felicitaciones asociamos este numero (*+"+ctx.from+"*) de Telefono al Cliente :"+cliente.apellido + " " + cliente.nombre+ ", Tenes Suerte , Tenes DATA !!!") ;        
        return endFlow("Muchas gracias por registrarte ... por favor envia un mensaje nuevamente para iniciar como cliente registrado !!!");
      }else {
        return endFlow("*La informacion proporcionada no coincide con ninguno de nuestros registros.. por favor verificala !!!*");
      }
    }  
  );

  export default flowValidarCliente;