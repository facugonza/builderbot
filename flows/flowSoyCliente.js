import { addKeyword } from '@builderbot/bot';
import flowResumen from "./flowResumen.js";
import flowDisponible from "./flowDisponible.js";
import flowPromociones from "./flowPromociones.js";
import flowAgente from "./flowAgente.js";
import flowDesvincular from "./flowDesvincular.js";
import flowCompras from "./flowCompras.js";
import flowLinkPagoMP from "./flowLinkPagoMP.js";
import flowdePrestamos from "./flowPrestamosCliente.js";
import flowPagarCompra from "./flowPagarCompra.js";
//import flowComprar from "./flowComprar.js";

async function tiempo() {
  //delay(3000);
  console.log("ADIOS >>>>>> ");
  return endFlow("Cerramos sesion por inactividad");
}

//let timer;
const opcionesPermitidas = ["SALDO", "MOVIMIENTOS","PRESTAMO", "RESUMEN", "OPERADOR", "PROMO","PROMOS","DESVINCULAR","PAGAR","COMPRAR"];

const flowSoyCliente = addKeyword("SoyClientedeTarjetaDATA", {sensitive : false})
.addAnswer(
    [
      "*-* Para pagar un compra. Responde *COMPRAR* ", "",
      "*-* Simular Prestamo. Responde *PRESTAMO* ", "",      
      "*-* Consultar tu saldo disponible. Responde *SALDO*", "",
      "*-* Descargar un resumen de tu cuenta. Responde *RESUMEN*", "", 
      "*-* Pagar Resumen actual. Responde *PAGAR*", "", 
      "*-* Conocer tus ultimos movimientos. Responde *MOVIMIENTOS*", "",      
      "*-* Hablar con un operador humano. Responde *OPERADOR* ", "",       
      "*-* Conocer nuestras promociones vigentes. Responde *PROMOS*", "",
      "*-* Desvincular este numero de telefono de la cuenta? Responde *DESVINCULAR*", 
    ],
  {capture : true},
  async (ctx, {endFlow, fallBack}) => {
    /*
    clearTimeout(timer); 
    timer = setTimeout(() => {
      console.log("ADIOS >>>>>> ");
      endFlow("*Se finaliza chat por inactividad*");
    }, 60000); 
    */   

    if (!opcionesPermitidas.includes(ctx.body.toUpperCase())) {
       return fallBack("Lo siento, *"+ctx.body+"* no es una opción válida. Por favor, intenta de nuevo.*(SALDO,COMPRAS,RESUMEN,PAGAR,PRESTAMO,OPERADOR,PROMOS,DESVINCULAR)*");
    }

  },
  [flowDisponible,flowCompras,flowResumen,flowLinkPagoMP,flowAgente,flowPromociones,flowDesvincular,flowdePrestamos,flowPagarCompra]
  )

  export default flowSoyCliente;  