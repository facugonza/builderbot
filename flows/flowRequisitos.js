import { addKeyword } from '@builderbot/bot';

const flowRequisitos = addKeyword("requisitos", { sensitive: false })
  .addAnswer(
    "📋 *Solo necesitas:*\n" +
      "– 🆔 *DNI*\n" +
      "– 🧾 *Boleta de servicios*\n" +
      "– 💼 *Último recibo de sueldos*\n" +
      "o\n" +
      "– 📜 *Últimos tres pagos del monotributo*\n" +
      "o\n" +
      "– 🏢 *Ingresos Brutos*\n\n" +
      "⚠️ *Sujeto a evaluación crediticia.*"
  )
  .addAnswer(
    "🙏 *Gracias por utilizar nuestro asistente virtual.*\n" +
      "✅ *Si tienes más preguntas o necesitas ayuda en el futuro, no dudes en contactarnos nuevamente.*\n" +
      "🌟 *¡Que tengas un excelente día!*"
  );

export default flowRequisitos;