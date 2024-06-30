import { addKeyword } from '@builderbot/bot';
import { getClienteData, setClienteData } from "../models/clienteDATA.js";
import { findCustomer } from "../services/dataclientes/clienteService.js";
import databaseLogger from '../logger/databaseLogger.js';
import acciones from '../models/acciones.js';


const flowCompras = addKeyword("MOVIMIENTOS", {sensitive : false})
.addAnswer(".", {delay : 1000},
  async(ctx,{endFlow,flowDynamic} ) => {
    
    databaseLogger.addLog(
      ctx.from,
      acciones.MOVIMIENTOS
    );

    try{
        const cliente = await findCustomer(ctx);
        
        if (Object.keys(cliente).length > 0){
            const compras = cliente.Compra;
            if (compras.length > 0) {
                await flowDynamic("*Estas son tus ultimas compras..:*");
                const messages = compras.map(compra => ({
                body: `total: ${compra.total}, fecha: ${compra.fecha}, empresa: ${compra.empresa}`
                }));            
                await flowDynamic(messages);    
            }else {
                await flowDynamic([{ body: "Al momento no tienes compras cargadas en nuestro sistema." }]);            
            }
            setClienteData(ctx,{});
            return endFlow("Si tienes más preguntas o necesitas ayuda, no dudes en contactarme nuevamente. *Tenes suerte .. Tenes DATA !!*");
        }
    }catch(error){
      console.log(error);      
    }
  }
);

export default  flowCompras;