import { addKeyword }  from '@builderbot/bot';
import { setClienteData } from "../models/clienteDATA.js";
//import { delay }  from '@builderbot/bot';
import { findCustomer } from "../services/dataclientes/clienteService.js";
import databaseLogger from '../logger/databaseLogger.js';
import acciones from '../models/acciones.js';


const flowDisponible = addKeyword("saldo", {sensitive : false})
.addAnswer(".", {delay : 500},
  async(ctx,{ endFlow,flowDynamic} ) => {
      const cliente = await findCustomer(ctx);

      if (Object.keys(cliente).length > 0){
        await flowDynamic([{body: "⏳ Aguarda un instante , *estoy obteniendo tu disponible para compras....*"}]);    
        //await delay(1000);
        await flowDynamic("💳 *El disponible actual de tu tarjeta es de $ "+ cliente.disponible +"*");

        setClienteData(ctx,{});
        

        databaseLogger.addLog(
           ctx.from,
          acciones.SALDO
        );
          
        return endFlow("✅ Si tienes más preguntas o necesitas ayuda, no dudes en contactarme nuevamente. *Tenes suerte .. Tenes DATA !!*");
      }
  }
);

export default  flowDisponible;