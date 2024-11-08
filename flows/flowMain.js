import dotenv from "dotenv";

import { addKeyword, EVENTS } from '@builderbot/bot';
import { findCustomer } from "../services/dataclientes/clienteService.js";
import flowSoyCliente from "./flowSoyCliente.js";
import flowPrincipal from "./flowPrincipal.js";
import { logger } from '../logger/logger.js';
import { emailLogger} from '../logger/logger.js';
import databaseLogger from '../logger/databaseLogger.js';
import { getClienteData } from "../models/clienteDATA.js";
import acciones from '../models/acciones.js';


dotenv.config();

const flowMain = addKeyword(EVENTS.WELCOME)
  .addAnswer(
      ["Hola, soy *DATABOT* tu asistente virtual .",
      "*Aguarda un instante, estoy verificando si este numero esta asociado a un cliente....*"],
     null, 
    async (ctx, { gotoFlow,flowDynamic }) => {
        try{
          
          databaseLogger.addLog(
            ctx.from,
            acciones.HOME
          );
    

          const cliente = await findCustomer(ctx);       

          if(cliente!=null && cliente.isLogin){  
              //endFlow = true;          
              //setClienteData(ctx,cliente);                         
              await flowDynamic("Bienvenido :"+getClienteData(ctx).apellido + " " + getClienteData(ctx).nombre+ ", Tenes Suerte , Tenes DATA !!!") ;
              /*logger.info("ctx > " + ctx.body);
              const keyword = ctx.body;
              logger.info("keyword > " + keyword);
              switch (keyword) {
                case 'SALDO':
                  return gotoFlow(flowDisponible);
                case 'COMPRAS':
                  return gotoFlow(flowCompras);
                case 'RESUMEN':
                  return gotoFlow(flowResumen);
                case 'OPERADOR':
                  return gotoFlow(flowAgente);
                case 'PROMO':
                case 'PROMOS':
                  return gotoFlow(flowPromociones);
                case 'DESVINCULAR':
                  return gotoFlow(flowDesvincular); 
                case 'PAGAR':
                  return gotoFlow(flowLinkPagoMP);  
                default:
                  return gotoFlow(flowSoyCliente);
            }
            */
            return gotoFlow(flowSoyCliente);
          }
          else {
              await flowDynamic("Bienvenido !") ;
              return gotoFlow(flowPrincipal);
          }
      }catch(error)  {
        logger.error(error.stack);
        emailLogger.error(error.stack);
      }
    }
  )

  export default  flowMain;