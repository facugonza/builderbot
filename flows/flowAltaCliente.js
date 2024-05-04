import { addKeyword } from '@builderbot/bot';
import nodemailer from "nodemailer";
//import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { writeFileSync, readFileSync } from "fs";
import { logger, emailLogger } from '../logger/logger.js';
import databaseLogger from '../logger/databaseLogger.js';
import acciones from '../models/acciones.js';

let lead = {
  nombre: "",
  apellido: "",
  dni: "",
  telefono: "",
  email: "",
  domicilio: "",
  expensas: "",
  agreeTerms: true,
};

async function sendEmail(files) {
  try {
    const transporter = nodemailer.createTransport({
      host: "sd-1973625-l.dattaweb.com", // Dirección del servidor SMTP
      port: 587, // Puerto (puede ser 25, 465, 587, dependiendo de tu servidor)
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: "facundogonzalez@tarjetadata.com.ar",
        pass: "Facundo123",
      },
    });

    const attachments = files.map((file) => ({
      filename: file.name,
      path: file.path,
    }));

    const bodyHtml = `
    Apellido y Nombre: ${lead.apellido} ${lead.nombre}<br>
    DNI: ${lead.dni}<br>
    Teléfono: ${lead.telefono}<br>
    Email: ${lead.email}<br>
    Domicilio: ${lead.domicilio}<br>
    <br>
    Además, se adjunta la documentación del cliente.`;

    const mailOptions = {
      from: "facundogonzalez@tarjetadata.com.ar",
      to: "luispalacio@tarjetadata.com.ar, GABRIELPEREZ@tarjetadata.com.ar, facugonza@gmail.com, angelachacon@gmail.com",
      subject: "Solicitud de apertura de Cuenta - DNI: "+ lead.dni,
      html: bodyHtml,
      attachments: attachments,
    };

  
    await transporter.sendMail(mailOptions);
    console.log("Email enviado exitosamente!");
  } catch (error) {
    emailLogger.error("Error al enviar el email: "+ lead.telefono , error);
  }
}



async function createDirectoryIfNotExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
}

function capturarRespuesta(ctx, fallBack, campo) {
  if (!ctx.body) {
    return fallBack();
  }
  lead[campo] = ctx.body;
}

const flowAltaCliente = addKeyword("solicitar" , {sensitive : false})

  .addAnswer(
    "Para continuar, necesito algunos datos personales. ¿Me podrías proporcionar tu nombre/s, por favor? Ej.*Juan*",
    { capture: true },
    (ctx, { fallBack }) => {
      databaseLogger.addLog(
        ctx.from,
        acciones.SOLICITAR
      );

      const nameRegex = /^[a-zA-Z\s]+$/;
      if (nameRegex.test(ctx.body)) {
        capturarRespuesta(ctx, fallBack, "nombre");
      } else {
        return fallBack("¿Puedes Verificar la información ingresada? Gracias.");
      }
    }
  )
  .addAnswer(
    "Gracias! ¿Podrías proporcionarme tu apellido, por favor?",
    { capture: true },
    (ctx, { fallBack }) => {
      const nameRegex = /^[a-zA-Z\s]+$/;
      if (nameRegex.test(ctx.body)) {
        capturarRespuesta(ctx, fallBack, "apellido");
      } else {
        return fallBack("¿Puedes Verificar la información ingresada? Gracias.");
      }
    }
  )
  .addAnswer(
    "¡Genial! ¿Cuál es tu número de DNI? Sin puntos.",
    { capture: true },
    (ctx, { fallBack }) => {
      const dniRegex = /^[1-9]\d{7}$/;
      if (dniRegex.test(ctx.body)) {
        capturarRespuesta(ctx, fallBack, "dni");
      } else {
        return fallBack(
          "¿Puedes Verificar el numero de DNI ingresado? Gracias. Ej:*22998695*"
        );
      }
    }
  )
  .addAnswer(
    "¡Perfecto!. Agendaré el siguiente numero de telefono como tu contacto.",
    null,
    async (ctx, { flowDynamic }) => {
      lead.telefono = "+" + ctx.from;
      return flowDynamic([
        {
          body: "+" + ctx.from,
        },
      ]);
    }
  )
  .addAnswer(
    "Por último, ¿podrías proporcionarme tu dirección de correo electrónico?",
    { capture: true },
    (ctx, { fallBack }) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(ctx.body)) {
        capturarRespuesta(ctx, fallBack, "email");
      } else {
        return fallBack("¿Puedes verificar el email ingresado ? Gracias.");
      }
    }
  )
  .addAnswer(
    "*Por favor enviame una foto del frente del  DNI.* (Esto es obligatorio)"
    ,{capture : true},
    async (ctx,{fallBack}) => {
      const userImagesDirectory = "./clientes/"+ctx.from; 
      await createDirectoryIfNotExists(userImagesDirectory);        
      try{
        //const buffer = await downloadMediaMessage(ctx, "buffer");
        //await writeFileSync(userImagesDirectory+"/dni-frente.jpeg", buffer);
        //console.log("FRENTE DNI > ");
        return;
      }catch(error){
        console.log("FRENTE DNI ERRO > " + error);
        return fallBack("Ocurrio un error , por favor reintenta !! " + error);
      }
    }  
  )
  .addAnswer(
    "*Excelente! Ahora enviame una foto del dorso del DNI.* (Esto es obligatorio)"
    ,{capture : true},
    async (ctx,{fallBack}) => {  
      const userImagesDirectory = "./clientes/"+ctx.from; 
      await createDirectoryIfNotExists(userImagesDirectory);        
      try{
        //const buffer = await downloadMediaMessage(ctx, "buffer");
        //writeFileSync(userImagesDirectory+"/dni-dorso.jpeg", buffer);
        console.log("FRENTE DORSO > ");
        return; 
      }catch(error){
        return fallBack("Ocurrio un error , por favor reintenta !! " + error);
      }
    }  
  )    
  .addAnswer(
    "Ahora, enviame una foto de una boleta de servicio. *Si no tienes una, solo envie una foto en blanco*.",
    {capture : true},
    async (ctx,{fallBack}) => {  
      try{
        //const buffer = await downloadMediaMessage(ctx, "buffer");
        //await writeFileSync("./clientes/"+ctx.from+"/boleta-servicio.jpeg", buffer);
      }catch(error){
        return fallBack("Ocurrio un error , por favor reintenta !! " + error);
      }
    }
  )
  .addAnswer(
    "Ahora enviame una foto de certificacion de ingresos (Ej: recibo de sueldo o boleta pago del monotributo). *Si no tiene, solo envie una foto en blanco*",
    {capture : true},
    async (ctx,{fallBack}) => {  
      try{
        //const buffer = await downloadMediaMessage(ctx, "buffer");
        //await writeFileSync("./clientes/"+ctx.from+"/certificado-ingresos.jpeg", buffer);
      }catch(error){
        return fallBack("Ocurrio un error , por favor reintenta !! " + error);
      }     
    }
  )
  .addAnswer(
    "Excelente !!! He derivado toda la documentacion a un asesor , el cual te contactara...Muchas gracias por completar el proceso por este medio!!! "
  )
  /*
  .addAction(
    async (ctx) => {  
      try{
        let data = JSON.stringify(lead, null, 2);
        fs.writeFile("./clientes/"+ctx.from+"/"+ctx.from+ ".json", data, (err) => {
            if (err) throw err;
            console.log('Datos guardados en miarchivo.json');
        }); 
      }catch(error){
        return fallBack("Ocurrio un error , por favor reintenta !! " + error);
      }     
    }
  );
    */
  .addAction(
    async (ctx) => {
      try {
        let data = JSON.stringify(lead, null, 2);
        fs.writeFileSync("./clientes/" + ctx.from + "/" + ctx.from + ".json", data);
  
        const files = [
          { path: "./clientes/" + ctx.from + "/dni-frente.jpeg", name: "dni-frente.jpeg" },
          { path: "./clientes/" + ctx.from + "/dni-dorso.jpeg", name: "dni-dorso.jpeg" },
          { path: "./clientes/" + ctx.from + "/boleta-servicio.jpeg", name: "boleta-servicio.jpeg" },
          { path: "./clientes/" + ctx.from + "/certificado-ingresos.jpeg", name: "certificado-ingresos.jpeg" },
        ];
  
        await sendEmail(files);
      } catch (error) {
        console.error("Ocurrió un error, por favor reintenta!", error);
      }
    }
  );
  
export default flowAltaCliente;