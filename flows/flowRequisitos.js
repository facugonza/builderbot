import { addKeyword } from '@builderbot/bot';

const flowRequisitos = addKeyword("requisitos", {sensitive : false})
  .addAnswer(
    "Solo necesitas:\n"+
    "– DNI\n"+
    "– Boleta de servicios\n"+
    "– Último recibo de sueldos\n"+
    "o\n"+
    "– Últimos tres pagos del monotributo\n"+
    "o\n"+
    "– Ingresos Brutos\n"+
    "*Sujeto a evaluación Crediticia.*",
  )
  .addAnswer("Gracias por utilizar nuestro asistente virtual. Si tienes más preguntas o necesitas ayuda en el futuro, no dudes en contactarnos nuevamente. ¡Que tengas un excelente día!"
  );

export default flowRequisitos;