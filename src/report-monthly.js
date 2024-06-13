//const mysql = require('mysql2');
//const nodemailer = require('nodemailer');
//const schedule = require('node-schedule');
//const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
//const fs = require('fs');
//const path = require('path');
//const CronJob = require('cron').CronJob;

import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import fs from 'fs';
import path from 'path';
import { CronJob } from 'cron';
import mysql from 'mysql';
import nodemailer from 'nodemailer';


function getFormattedDate() {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function sendEmail() {
  // Configurar la conexión a la base de datos8
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'databot'
  });


  function  generatePieChart(data) {
    const width = 400; // Ancho de la imagen del gráfico
    const height = 400; // Alto de la imagen del gráfico
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });
  
     const configuration = {
      type: 'pie',
      data: {
        datasets: [{
          data: [
            data.Total_Resumen_Count,
            data.Total_Saldo_Count,
            data.Total_Operador_Count,
            data.Total_Pagar_Count,
            data.Total_Promos_Count,
            data.Total_Compras_Count,
            data.Total_Prestamo_Count
          ],
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#E7E9ED',
            '#4BC0C0',
            '#9966FF',
            '#00A86B'  // Color para Prestamo, añadido
          ],
          label: 'Dataset 1'
        }],
        labels: [
          'Resumen',
          'Saldo',
          'Operador',
          'Pagar',
          'Promos',
          'Compras',
          'Prestamo'
        ]
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Porcentaje de Mensajes por Palabra Clave'
          }
        }
      }
    };
  
    return chartJSNodeCanvas.renderToBuffer(configuration);
  }

  connection.connect();

  // Consulta SQL para obtener el detalle de los teléfonos y la cantidad de mensajes
  const sql = `
  SELECT phone,fecha, SUM(message_count) AS total_message_count
  FROM (
      SELECT phone, COUNT(*) AS message_count , Date(creationDate) as fecha 
      FROM history
      WHERE DATE(creationDate) BETWEEN '2024-04-01' AND '2024-04-30'
      GROUP BY phone,fecha
  
      UNION ALL
  
      SELECT telefono AS phone, COUNT(*) AS message_count , date(fecha_hora) as fecha
      FROM messages
      WHERE DATE(fecha_hora) BETWEEN '2024-04-01' AND '2024-04-30'
      GROUP BY telefono,fecha
  ) AS combined
  GROUP BY phone,fecha
  ORDER BY total_message_count,fecha DESC;
  
  `;

  const keywordSql = `
  SELECT 
    SUM(Resumen_Count) AS 'Total_Resumen_Count',
    SUM(Saldo_Count) AS 'Total_Saldo_Count',
    SUM(Operador_Count) AS 'Total_Operador_Count',
    SUM(Pagar_Count) AS 'Total_Pagar_Count',
    SUM(Promos_Count) AS 'Total_Promos_Count',
    SUM(Compras_Count) AS 'Total_Compras_Count',
    SUM(Movimientos_Count) AS 'Total_Movimientos_Count',
    SUM(Prestamo_Count) AS 'Total_Prestamo_Count',
    SUM(Solicitar_Count) AS 'Total_Solicitar_Count',
    SUM(Requisitos_Count) AS 'Total_Requisitos_Count'
FROM (
    SELECT 
        SUM(answer LIKE '%RESUMEN%') AS 'Resumen_Count',
        SUM(answer LIKE '%SALDO%') AS 'Saldo_Count',
        SUM(answer LIKE '%OPERADOR%') AS 'Operador_Count',
        SUM(answer LIKE '%PAGAR%') AS 'Pagar_Count',
        SUM(answer LIKE '%PROMOS%') AS 'Promos_Count',
        SUM(answer LIKE '%COMPRAS%') AS 'Compras_Count',
        0 AS 'Movimientos_Count',
        0 AS 'Prestamo_Count',
        0 AS 'Solicitar_Count',
        0 AS 'Requisitos_Count'
    FROM history
    WHERE DATE(creationDate) BETWEEN '2024-04-01' AND '2024-04-30'
    AND answer NOT LIKE '%-* Consultar tu saldo disponible%'
    AND answer NOT LIKE '%Obteniendo tu ultimo resumen generado con vencimiento%'
    AND answer NOT LIKE '%Resumen N°%'
    AND answer NOT LIKE '%Lo siento,%'
    AND answer NOT LIKE '%Aguarda un instante... generando tus links de pagos para resumen%'
    
    UNION ALL
    
    SELECT 
        SUM(accion = 'RESUMEN') AS 'Resumen_Count',
        SUM(accion = 'SALDO') AS 'Saldo_Count',
        SUM(accion = 'OPERADOR') AS 'Operador_Count',
        SUM(accion = 'PAGAR') AS 'Pagar_Count',
        SUM(accion = 'PROMOS') AS 'Promos_Count',
        0 AS 'Compras_Count',
        SUM(accion = 'MOVIMIENTOS') AS 'Movimientos_Count',
        SUM(accion = 'PRESTAMO') AS 'Prestamo_Count',
        SUM(accion = 'SOLICITAR') AS 'Solicitar_Count',
        SUM(accion = 'REQUISITOS') AS 'Requisitos_Count'
    FROM messages
    WHERE DATE(fecha_hora) BETWEEN '2024-04-01' AND '2024-04-30'
) AS combined_results;
`;

  connection.query(sql, (error, results) => {
    if (error) throw error;
  
    // Variables para almacenar la cantidad total de mensajes y personas
    let totalMessages = 0;
    let totalPersonas = 0;
  
    // Crear la tabla de totales
    let emailContent = '<h3><strong>Resumen Total:</strong></h3>';
    emailContent += '<table border="1" cellpadding="5" cellspacing="0">';
    emailContent += '<tr><th>Total de Personas</th><th>Total de Mensajes Procesados</th></tr>';
    
    results.forEach(row => {
      totalMessages += parseInt(row.total_message_count,10);
      totalPersonas++;
    });
  
    emailContent += `<tr><td>${totalPersonas}</td><td>${totalMessages}</td></tr>`;
    emailContent += '</table>';
  
    // Espacio adicional o línea horizontal para separar las tablas
    emailContent += '<hr>';
    emailContent += '<hr>';
  
    connection.query(keywordSql, async (error, keywordResults) => {
      if (error) throw error;    
      

      //const keywordRow = keywordResults[0];
      emailContent += '<hr>';
      emailContent += '<h3>Resumen de palabras clave para el día actual: </strong></h3>';
      emailContent += '<table border="1" cellpadding="5" cellspacing="0">';
      emailContent += '<tr><th>Saldo</th><th>Movimientos</th><th>Prestamo</th><th>Resumen</th><th>Operador</th><th>Promos</th><th>Pagar</th><th>Solicitar</th><th>Requisitos</th></tr>';
      
      let dataSource;       
      keywordResults.forEach(keywordRow => {
        emailContent += `<tr><td>${keywordRow.Total_Saldo_Count}</td><td>${keywordRow.Total_Movimientos_Count}</td><td>${keywordRow.Total_Prestamo_Count}</td><td>${keywordRow.Total_Resumen_Count}</td><td>${keywordRow.Total_Operador_Count}</td><td>${keywordRow.Total_Promos_Count}</td><td>${keywordRow.Total_Pagar_Count}</td><td>${keywordRow.Total_Solicitar_Count}</td><td>${keywordRow.Total_Requisitos_Count}</td></tr>`;
        dataSource = keywordRow;
      });

      emailContent += '</table>';

      const imageBuffer = await generatePieChart(dataSource);
      const imagePath = path.join(__dirname, 'chart.png');
      fs.writeFileSync(imagePath, imageBuffer);

      // Crear la tabla de detalles
      emailContent += '<h3>Detalle de números de teléfonos: </strong></h3>';
      emailContent += '<table border="1" cellpadding="5" cellspacing="0">';
      emailContent += '<tr><th>Teléfono</th><th>Cantidad de mensajes</th></tr>';

      results.forEach(row => {
        emailContent += `<tr><td>${row.phone}</td><td>${row.total_message_count}</td></tr>`;
      });

      emailContent += '</table>';

      // Configurar el transporte de correo
      const transporter = nodemailer.createTransport({
        host: 'sd-1973625-l.dattaweb.com',
        port: 587,
        secure: false,
        auth: {
          user: 'facundogonzalez@tarjetadata.com.ar',
          pass: 'Facundo123',
        }
      });

      const todayDate = getFormattedDate();
      // Opciones de correo electrónico
      const mailOptions = {
        from: 'facundogonzalez@tarjetadata.com.ar',
        to: 'facugonza@gmail.com',
        subject:  '02-2024', //`Cantidad de Personas Atendidas hoy: (${todayDate})`,
        html: emailContent,
        attachments: [{
          filename: 'databot-resumen-mensual.png',
          path: imagePath // Adjuntamos la imagen desde la ruta del archivo
        }]
      };

      // Enviar el correo electrónico
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log('Email enviado: ' + info.response);
        }
      });
    });
    connection.end();
  });
}

if (process.argv[2] === 'run') {
  sendEmail();
} else {
  // Crear un nuevo trabajo cron que se ejecuta el último día de cada mes a las 23:59
  const job = new CronJob(
    '0 59 23 L * *',
    function() {
      sendEmail();
      console.log('Correo enviado a las 23:59 del último día del mes.');
    },
    null,
    true,
    'America/Argentina/Buenos_Aires' // Asegúrate de poner tu zona horaria correcta
  );

  job.start();

}

console.log('Tarea cron programada para las 23:59 del último día de cada mes.');