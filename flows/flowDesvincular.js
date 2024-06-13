import dotenv from "dotenv";
dotenv.config();

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
  

const flowDesvincular = addKeyword("desvincular", {sensitive : false})
  .addAnswer(
    "Confirmas desvincular este numero de telefono de cuenta ? , responde *SI o NO* para confirmar o cancelar",
    { capture: true },
    async (ctx, { endFlow ,flowDynamic }) => {
      const cliente = await findCustomer(ctx);
      if (Object.keys(cliente).length > 0){                
        if (ctx.body.toLowerCase() == "si") {
            const datosCliente= {};
            datosCliente.numeroTelefono  = ctx.from;
            datosCliente.dni  = cliente.documento; 
            const desvincularCliente = await desvincularCuenta(datosCliente);
            setClienteData(ctx,{});
            if (desvincularCliente!=null && desvincularCliente.success){                
                return endFlow("Desvinculamos este numero (*+"+ctx.from+"*) de Telefono del Cliente *:"+cliente.apellido + " " + cliente.nombre+ "* !!") ;        
            }else {
              return flowDynamic("*No se pudo procesar la solicitud en este momento .... reintenta luego !!*") ;        
            }
        } else {
          setClienteData(ctx,{});
          return endFlow("*OPERACION CANCELADA*. Si tienes más preguntas o necesitas ayuda, no dudes en contactarme nuevamente. *Tenes suerte .. Tenes DATA !!*");
        } 
      }
    }
  );

  export default  flowDesvincular;