import dotenv from "dotenv";
dotenv.config();


import { addKeyword } from '@builderbot/bot';
import { setClienteData } from "../models/clienteDATA.js";
import { findCustomer } from "../services/dataclientes/clienteService.js";
import axios from "axios";

let datosCliente= {
    numeroTelefono:"",
    dni:"",
}


const desvincularCuenta = async () => {
    try {
      var config = {
        method: "POST",
        url: process.env.API_URL_DESVINCULAR, //"http://200.70.56.203:8021/AppMovil/DesvincularCliente",
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
  

const flowDesvincular = addKeyword("desvincular", {sensitive : false})
  .addAnswer(
    "Confirmas la desvincular numero de telefono de cuenta ? , responde *SI o NO* para confirmar o cancelar",
    { capture: true },
    async (ctx, { endFlow ,flowDynamic }) => {
      const cliente = findCustomer(ctx);

      if (Object.keys(cliente).length > 0){        
        setClienteData(ctx,{});
        if (ctx.body.toLowerCase() == "si") {
            datosCliente.numeroTelefono  = ctx.from;
            datosCliente.dni  = cliente.documento; 
            const desvincularCliente = await desvincularCuenta();
            if (desvincularCliente!=null && desvincularCliente.success){
                return endFlow("Desvinculamos este numero (*+"+ctx.from+"*) de Telefono del Cliente *:"+cliente.apellido + " " + cliente.nombre+ "* !!") ;        
            }else {
              return flowDynamic("*No se pudo procesar la solicitud en este momento .... reintenta luego !!*") ;        
            }
        } else {
          return endFlow("*OPERACION CANCELADA*. Si tienes más preguntas o necesitas ayuda, no dudes en contactarme nuevamente. *Tenes suerte .. Tenes DATA !!*");
        } 
      }
    }
  );

  export default  flowDesvincular;