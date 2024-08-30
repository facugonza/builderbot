import { addKeyword } from '@builderbot/bot';
import nodemailer from "nodemailer";
//import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { readdirSync,writeFileSync, existsSync, mkdirSync } from "fs";
//import { readdir } from 'fs/promises';

import fs from 'fs-extra';
import { join } from 'path';
import { logger, emailLogger } from '../logger/logger.js';
import databaseLogger from '../logger/databaseLogger.js';
import acciones from '../models/acciones.js';

const FILES_PATH = "../clientes/";
//import { BaileysProvider  } from '@builderbot/provider-baileys'

//import builderbotProvider from '@builderbot/provider-baileys';  // Importar el paquete completo
//const { saveFile } = builderbotProvider;  // Extraer la función necesaria
//import { saveFile } from '@builderbot/provider-baileys'

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
        pass: "Facundo2000@*",
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
    emailLogger.error("Error al enviar el email: "+ lead.telefono , error.stack);
  }
}



async function createDirectoryIfNotExists(directory) {
  try{
    if (!existsSync(directory)) {
      mkdirSync(directory);
    }else {
      // Eliminar todos los archivos JPEG en el directorio
      /*const files = await fs.readdir(directory);
      for (const file of files) {
        if (file.endsWith('.jpeg')) {
          await fs.unlink(join(directory, file));
        } 
      }*/
    }
  }catch(error){
    console.log(error);
    emailLogger.error("ERROR createDirectoryIfNotExists :", error.stack);
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
    async (ctx,{fallBack, provider }) => {
      const userImagesDirectory = FILES_PATH+ctx.from; 
      await createDirectoryIfNotExists(userImagesDirectory);        
      try{
        const localPath = await provider.saveFile(ctx, {path:userImagesDirectory});
        console.log("FRENTE DNI >" + localPath);
        return;
      }catch(error){
        console.error("FRENTE DNI ERROR > " + error.stack);
        return fallBack("Ocurrio un error , por favor reintenta !! " );
      }
    }  
  )
  .addAnswer(
    "*Excelente! Ahora enviame una foto del dorso del DNI.* (Esto es obligatorio)"
    ,{capture : true},
    async (ctx,{fallBack,provider}) => {  
      const userImagesDirectory = FILES_PATH+ctx.from; 
      await createDirectoryIfNotExists(userImagesDirectory);        
      try{
        const localPath = await provider.saveFile(ctx, {path:userImagesDirectory});
        console.log("FRENTE DORSO > " +localPath);
        return; 
      }catch(error){
        return fallBack("Ocurrio un error , por favor reintenta !! " );
      }
    }  
  )    
  .addAnswer(
    "Ahora, enviame una foto de una boleta de servicio. *Si no tienes una, solo envie una foto en blanco*.",
    {capture : true},
    async (ctx,{fallBack,provider}) => {  
      try{
        const userImagesDirectory = FILES_PATH+ctx.from; 
        const localPath = await provider.saveFile(ctx, {path:userImagesDirectory});
        console.log("BOLETA SERVICIO > " +localPath);
        return; 
      }catch(error){
        logger.error(error.stack)
        return fallBack("Ocurrio un error , por favor reintenta !! ");
      }
    }
  )
  .addAnswer(
    "Ahora enviame una foto de certificacion de ingresos (Ej: recibo de sueldo o boleta pago del monotributo). *Si no tiene, solo envie una foto en blanco*",
    {capture : true},
    async (ctx,{fallBack,provider}) => {  
      try{
        const userImagesDirectory = FILES_PATH+ctx.from; 
        const localPath = await provider.saveFile(ctx, {path:userImagesDirectory});
        console.log("CERTIFICADO INGRESOS > " +localPath);
        return; 
      }catch(error){
        console.error(error.stack);
        return fallBack("Ocurrio un error , por favor reintenta !! ");
      }     
    }
  )
  .addAnswer(
    "Excelente !!! He derivado toda la documentacion a un asesor , el cual te contactara...Muchas gracias por completar el proceso por este medio!!! "
  )
  .addAction(
    async (ctx) => {
      try {
        let data = JSON.stringify(lead, null, 2);
        fs.writeFileSync(FILES_PATH + ctx.from + "/" + ctx.from + ".json", data);
        
        const userImagesDirectory = FILES_PATH + ctx.from; 
        /*
        const files = [
          { path: "./clientes/" + ctx.from + "/dni-frente.jpeg", name: "dni-frente.jpeg" },
          { path: "./clientes/" + ctx.from + "/dni-dorso.jpeg", name: "dni-dorso.jpeg" },
          { path: "./clientes/" + ctx.from + "/boleta-servicio.jpeg", name: "boleta-servicio.jpeg" },
          { path: "./clientes/" + ctx.from + "/certificado-ingresos.jpeg", name: "certificado-ingresos.jpeg" },
        ];
        */
        const files = (await fs.readdir(userImagesDirectory))
        .filter(file => file.endsWith('.jpeg'))
        .map(file => ({
          path: join(userImagesDirectory, file),
          name: file
        }));

        await sendEmail(files);
      } catch (error) {
        console.error("Ocurrió un error, por favor reintenta!", error.stack);
      }
    }
  );
  
export default flowAltaCliente;