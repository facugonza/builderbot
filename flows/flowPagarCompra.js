import dotenv from "dotenv";
dotenv.config();

import { addKeyword, EVENTS } from '@builderbot/bot';
import { logger, emailLogger } from '../logger/logger.js';
import { findCustomer } from "../services/dataclientes/clienteService.js";
import { findComercio,findPlanActiveByComercio,procesarCompra } from "../services/compras/comprasService.js";
import fs from 'fs';
import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PDFs
const PDF_DIRECTORY = path.join(__dirname, '../pdfs');

if (!fs.existsSync(PDF_DIRECTORY)) {
  fs.mkdirSync(PDF_DIRECTORY);
}

//comprobante 
async function generateTransactionPDF(transactionDetails) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const pdfPath = path.join(PDF_DIRECTORY, `transaccion_${transactionDetails.id}.pdf`);
    const stream = fs.createWriteStream(pdfPath);

    doc.pipe(stream);
    
// logo
  const logoPath = path.join(__dirname, '../logo/datalogo.jpg');

// encabezado con Logo
  doc.image(logoPath, 70, 30, { width: 90 });  // Logo de la empresa en el encabezado
  doc.moveDown(4);

  doc
    .moveDown(1)
    .fontSize(18)
    .fillColor('#333333')
    .text("Comprobante de Compra", { align: "left" })  
    .moveDown(0.5)
    .fontSize(10)
    .fillColor('#888888')
    .text(`Fecha de emisión: ${transactionDetails.fechaHora}`, { align: "left" })
    .moveDown(2);  

  
  doc
    .moveDown(1.5)
    .fontSize(28)
    .fillColor('#000000')
    .text(`TOTAL $ ${transactionDetails.monto.toFixed(2)}`, { align: "left" })
    .moveDown(0.5);  

  doc
    .fontSize(16)
    .fillColor('#555555')
    .moveDown(0.2)
    .text(`En ${transactionDetails.cuotas} cuota${transactionDetails.cuotas > 1 ? 's' : ''} x $${transactionDetails.montoPorCuota}`, { align: "left" })
    .moveDown(1);  
  
  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .strokeColor("#cccccc")
    .lineWidth(1)
    .stroke();


// sección "Para" 
doc
.moveDown(1.5)
.fontSize(16)
.fillColor('#333333')
.text(`COMERCIO`, { align: "left"  })
.moveDown(0.5)
.fontSize(12)
.text(`Número Comercio: ${transactionDetails.numeroComercio}`, { align: "left"  })
.text(`Nombre Comercio: ${transactionDetails.comercio}`, { align: "left"  })
.moveDown(1.5);


// seccion "de"
doc
  .moveDown(1.2)
  .fontSize(16)
  .fillColor('#333333')
  .text(`CLIENTE`, { align: "left" })
  .moveDown(0.5)
  .fontSize(12)
  .text(`Nombre y Apellido: ${transactionDetails.clienteNombre}`, { align: "left" })
  .text(`Últimos 4 Digitos de la Tajeta: ${transactionDetails.ultimosCuatroDigitos}`, { align: "left" })
  .moveDown(1);
  
// Número de transacción
  doc
    .moveDown(1.5)
    .fontSize(12)
    .fillColor('#000000')
    .text("Número de operación:", 50, doc.y + 30,  { align: "center" })
    .moveDown(0.5)
    .fontSize(12)
    .text(transactionDetails.transaccionId, { align: "center", color: '#0000FF' })
    .moveDown(2);  

  // pie de paginna
  doc
    .fontSize(8)
    .fillColor('#888888')
    .text("Gracias por confiar en Tarjeta DATA.", 50, doc.y + 30, { align: "center" })
    .text("Este comprobante es solo para fines informativos.", { align: "center" })
    .moveDown(0.5)
    .fillColor('#aaaaaa')
    .text("Tenes Suerte. Tenes DATA.", { align: "center" });

  doc.end();

  stream.on("finish", () => resolve(pdfPath));
  stream.on("error", reject);
});
}

// funcion monto x cuota

function numeroALetras(num) {
  const unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const especiales = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE"];
  const decenas = ["", "", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const centenas = ["", "CIEN", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

  function getUnidades(n) {
      return unidades[n];
  }

  function getDecenas(n) {
      if (n < 10) return getUnidades(n);
      if (n < 16) return especiales[n - 10];
      const dec = Math.floor(n / 10);
      const unit = n % 10;
      return decenas[dec] + (unit ? " Y " + getUnidades(unit) : "");
  }

  function getCentenas(n) {
      const cent = Math.floor(n / 100);
      const dec = n % 100;
      if (n === 100) return "CIEN";
      return centenas[cent] + (dec ? " " + getDecenas(dec) : "");
  }

  function getMiles(n) {
      const mil = Math.floor(n / 1000);
      const resto = n % 1000;
      if (mil === 1) return "MIL " + getCentenas(resto);
      return getCentenas(mil) + " MIL " + (resto ? getCentenas(resto) : "");
  }

  function getCientosDeMiles(n) {
      const cienMil = Math.floor(n / 1000);
      const resto = n % 1000;
      if (cienMil === 100) return "CIEN MIL " + (resto ? getCentenas(resto) : "");
      return getCentenas(cienMil) + " MIL " + (resto ? getCentenas(resto) : "");
  }

  function getMillones(n) {
      const millon = Math.floor(n / 1000000);
      const resto = n % 1000000;
      if (millon === 1) return "UN MILLÓN " + getCientosDeMiles(resto);
      return getUnidades(millon) + " MILLONES " + getCientosDeMiles(resto);
  }

  const entero = Math.floor(num);
  const centavos = Math.round((num - entero) * 100);

  let parteEntera = "";
  if (entero >= 1000000) {
      parteEntera = getMillones(entero);
  } else if (entero >= 100000) {
      parteEntera = getCientosDeMiles(entero);
  } else if (entero >= 1000) {
      parteEntera = getMiles(entero);
  } else {
      parteEntera = getCentenas(entero);
  }

  const parteCentavos = centavos > 0 ? `CON ${getDecenas(centavos)} CENTAVOS` : "";
  
  return `${parteEntera.trim()} PESOS ${parteCentavos}`.trim();
}


const flowPagarCompras = addKeyword("COMPRA", "COMPRAR", { sensitive: false })
  .addAnswer(
    ".",
    { capture: false },
    async (ctx, { flowDynamic, state }) => {
      state.clear();
      const cliente = await findCustomer(ctx);

      if (Object.keys(cliente).length > 0) {
        return flowDynamic([
          { body: `💳 *Recuerda que tu saldo disponible para compras actual es de: $${cliente.disponible}.*` },
        ]);
      } else {
        return flowDynamic(".");
      }
    }
  )
  .addAnswer(
    "📌 *Para continuar, ¿Me podrías proporcionar el número de comercio, por favor? Solo números (ej. 4500)*",
    { capture: true },
    async (ctx, { fallBack, flowDynamic, state }) => {
      try {
        const comercioRegex = /^\d{1,6}$/;
        console.log("Número de comercio recibido: ", ctx.body);
        if (comercioRegex.test(ctx.body)) {
          const comercio = await findComercio(ctx.body);
          if (comercio) {
            const infoCompra = {};
            infoCompra.comercio = comercio;
            infoCompra.numeroComercio = ctx.body;
            await state.update({ venta: infoCompra });
          } else {
            console.log("Comercio no encontrado en la base de datos");
            return fallBack(
              "❌ *El número de comercio ingresado no fue encontrado en nuestra base de datos. Por favor, intenta de nuevo.*"
            );
          }
        } else {
          console.log("Número de comercio no válido: ", ctx.body);
          return fallBack(
            "⚠️ *El número de comercio ingresado no es válido. Por favor, reingrésalo.*"
          );
        }
      } catch (error) {
        console.log("Error al buscar el comercio: ", error.stack);
        emailLogger.error(error.stack);
        logger.error(error.stack);
      }
    }
  )
  .addAnswer(
    "⏳ *Aguarda un instante... estoy obteniendo los datos del comercio.*",
    { capture: false },
    async (ctx, { flowDynamic, state }) => {
      const compra = await state.get("venta");
      const comercio = compra.comercio;
      await flowDynamic([
        { body: `🏢 *Estás por realizar una compra en: ${comercio.puntos[0].descrpto}.*` },
      ]);
    }
  )
  .addAnswer(
    "📌 *¿Me podrías proporcionar el importe de la compra, por favor? (Ejemplo: 1000.00)*",
    { capture: true },
    async (ctx, { fallBack, state }) => {
      const importeRegex = /^\d+(\.\d+)?$/;
      if (importeRegex.test(ctx.body)) {
        await state.update({ importeCompra: parseFloat(ctx.body) });
      } else {
        return fallBack("⚠️ *El importe ingresado no es válido. Por favor, reintenta.*");
      }
    }
  )
  .addAnswer(
    "🔄 *Por favor, reingresa nuevamente el importe para confirmarlo y continuar con la operación.*",
    { capture: true },
    async (ctx, { fallBack, state }) => {
      const importeRegex = /^\d+(\.\d+)?$/;
      if (importeRegex.test(ctx.body)) {
        const importeCompraFirst = state.get("importeCompra");
        if (importeCompraFirst != parseFloat(ctx.body)) {
          return fallBack(
            "⚠️ *El importe ingresado no coincide con el valor ingresado previamente. Por favor, reintenta.*"
          );
        }
      } else {
        return fallBack("⚠️ *El importe ingresado no es válido. Por favor, reintenta.*");
      }
    }
  )
  .addAnswer(
    "⏳ *Obteniendo opciones de pago. Por favor, espera un momento.*",
    { capture: false },
    async (ctx, { flowDynamic, endFlow, state }) => {
      try {
        const compra = state.get("venta");
        const planActivo = findPlanActiveByComercio(compra.comercio, compra.numeroComercio);
        compra.planActivo = planActivo;

        if (planActivo === 53 || planActivo === 1) {
          compra.opcionesCuotas = [1];
        } else if (planActivo === 2) {
          compra.opcionesCuotas = [1, 3, 6, 12];
        } else {
          return endFlow("❌ *Lo siento, no hay planes de pago activos disponibles para este comercio.*");
        }

        const importeCompra = state.get("importeCompra");

        let mensajeCuotas = `💳 *Opciones de cuotas para el comercio: ${compra.comercio.puntos[0].descrpto}*\n\n*Cuotas disponibles:*`;
        compra.opcionesCuotas.forEach((cuota) => {
          const valorCuota = (importeCompra / cuota).toFixed(2);
          mensajeCuotas += `\n${cuota} cuota${cuota > 1 ? "s" : ""} x $${valorCuota}`;
        });

        await state.update({ venta: compra });
        flowDynamic([{ body: mensajeCuotas }]);
      } catch (error) {
        emailLogger.error(error.stack);
        logger.error(error.stack);
        return endFlow("❌ *Ocurrió un error procesando la operación. Por favor, intenta nuevamente más tarde.*");
      }
    }
  )
  .addAnswer(
    "📌 *Ingresa la cantidad de cuotas seleccionada en números, por favor. Ejemplo: 3*",
    { capture: true },
    async (ctx, { fallBack, flowDynamic, state }) => {
      const compra = state.get("venta");
      const cantidadCuotasRegex = /^\d{1,2}$/;
      const importeCompra = state.get("importeCompra");

      if (cantidadCuotasRegex.test(ctx.body)) {
        const cuotasIngresadas = parseInt(ctx.body, 10);

        if (compra.opcionesCuotas.includes(cuotasIngresadas)) {
          compra.cuotasSeleccionadas = cuotasIngresadas;

          const leyendaCuotas = cuotasIngresadas !== 1 ? "cuotas" : "cuota";
          const importeEnLetras = numeroALetras(importeCompra);
          compra.montoPorCuota = (importeCompra / cuotasIngresadas).toFixed(2);
          await state.update({ venta: compra });

          await flowDynamic([
            {
              body: `✅ *Confirmas la compra en el comercio: ${compra.comercio.puntos[0].descrpto} por un importe de $${importeCompra} (${importeEnLetras}) en ${cuotasIngresadas} ${leyendaCuotas}.*`,
            },
          ]);
        } else {
          return fallBack(
            `⚠️ *La cantidad de cuotas ingresada no es válida. Por favor, elige entre las opciones disponibles: ${compra.opcionesCuotas.join(", ")}.*`
          );
        }
      } else {
        return fallBack("⚠️ *El número de cuotas ingresado no es válido. Por favor, reintenta.*");
      }
    }
  )
  .addAnswer(
    "🔑 *Por último, para confirmar la operación, ingresa tu número de DNI (sin puntos).*",
    { capture: true },
    async (ctx, { fallBack, endFlow, flowDynamic, state }) => {
      try {
        const dniRegex = /^\d{1,8}$/;
        if (dniRegex.test(ctx.body)) {
          const dniIngresado = parseInt(ctx.body);
          const cliente = await findCustomer(ctx);

          if (dniIngresado === cliente.documento) {
            const result = await procesarCompra(cliente, state);
            if (result.success) {
              const pdfPath = await generateTransactionPDF(result.transactionDetails);

              await flowDynamic([
                {
                  body: "✅ *Transacción realizada con éxito. A continuación te envío el comprobante:*",
                  media: pdfPath,
                },
              ]);

              state.clear();
              return endFlow("🎉 *¡Transacción completada! ¡Tenés suerte... tenés DATA!*");
            } else {
              return flowDynamic([{ body: "❌ " + result.message }]);
            }
          } else {
            return fallBack("❌ *El número de DNI ingresado no coincide con nuestros registros. Por favor, reintenta.*");
          }
        } else {
          return fallBack("⚠️ *El número ingresado no es válido. Por favor, intenta nuevamente.*");
        }
      } catch (error) {
        console.error("Error al procesar la compra:", error.stack);
        emailLogger.error(error.stack);
        return endFlow("❌ *Ocurrió un error procesando la operación. Por favor, intenta nuevamente más tarde.*");
      }
    }
  );

export default flowPagarCompras;
