import { addKeyword, EVENTS } from '@builderbot/bot';
import axios from "axios";

import dotenv from "dotenv";
dotenv.config();

import databaseLogger from '../logger/databaseLogger.js';
import acciones from '../models/acciones.js';



let datosCliente= {
    dni: "",
    fechaNacimiento : "",
    numeroTelefono:"",
    ultimosCuatroDigitos:"",
};


const asociarCliente = async () => {
  try {
    
    databaseLogger.addLog(
      ctx.from,
      acciones.VINCULAR
    );

    console.log ("DATOS CLIENTES : "  + JSON.stringify(datosCliente))
    var config = {
      method: "POST",
      url: process.env.API_URL_VINCULAR , //"http://200.70.56.203:8021/AppMovil/ValidarCliente",
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify(datosCliente),
    };

    const response = await axios(config);
    return response.data;
  } catch (e) {
    console.log("ERROR : "+e);
    return null;
  }
};


const flowValidarCliente = addKeyword("cliente", {sensitive : false})
  .addAnswer(
    ["¡Claro! Antes de continuar, necesito validar DNI. ¿Me podrías proporcionar numero de DNI, por favor?"],
    { capture: true },
    (ctx, { fallBack }) => {
        console.log("flowValidarCliente  > DNI");
        const importeRegex = /^\d+$/;
        if (importeRegex.test(ctx.body)) {
          console.log("flowValidarCliente  > DNI");
          datosCliente.dni = ctx.body;   
          datosCliente.numeroTelefono= ctx.from;         
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
    (ctx, { fallBack }) => {
        console.log("flowValidarCliente  > NACIMIENTO");
        const fechaNacimientoRegex = /^(0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.](19|20)\d\d$/;
        if (fechaNacimientoRegex.test(ctx.body)) {
            datosCliente.fechaNacimiento  = ctx.body; 
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
    (ctx, { fallBack }) => {
        console.log("flowValidarCliente  > 4 DIGITOS");
        const ultimosCuatroDigitosRegex = /^\d{4}$/;
        if (ultimosCuatroDigitosRegex.test(ctx.body)) {
            datosCliente.ultimosCuatroDigitos  = ctx.body; 
        } else {
          return fallBack(
            "¿Puedes Verificar los digitos ingresados. *EJ: 1234*  ? Gracias."
          );
        }  
    }
  )  
  .addAnswer( "Muchas gracias !! Aguarda un instante por favor ...estoy validando tus datos !!!",null,
  async (ctx, { flowDynamic,endFlow }) => {
      const cliente = await asociarCliente();
      console.log("cliente.isLogin : " + cliente.isLogin);        
      if (cliente!=null && cliente.isLogin){
        await flowDynamic("Felicitaciones asociamos este numero (*+"+ctx.from+"*) de Telefono al Cliente :"+cliente.apellido + " " + cliente.nombre+ ", Tenes Suerte , Tenes DATA !!!") ;        
        return endFlow("Muchas gracias por registrarte ... por favor envia un mensaje nuevamente para iniciar como cliente registrado !!!");
      }else {
        return endFlow("*La informacion proporcionada no coincide con ninguno de nuestros registros.. por favor verificala !!!*");
      }
  }  
  );

  export default flowValidarCliente;