import mysql from 'mysql2';
import nodemailer from 'nodemailer';
import schedule from 'node-schedule';

function getFormattedDate() {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function sendEmail() {
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'databot'
  });

  connection.connect();

  const sql = `
    SELECT telefono, COUNT(*) AS message_count
    FROM messages
    WHERE DATE(fecha_hora) = CURDATE()
    GROUP BY telefono
    ORDER BY message_count DESC;
  `;

  const keywordSql = `
    SELECT 
      SUM(accion = 'SALDO') AS 'Saldo_Count',
      SUM(accion = 'MOVIMIENTOS') AS 'Movimientos_Count',
      SUM(accion = 'PRESTAMO') AS 'Prestamo_Count',
      SUM(accion = 'RESUMEN') AS 'Resumen_Count',
      SUM(accion = 'OPERADOR') AS 'Operador_Count',
      SUM(accion = 'PROMOS') AS 'Promos_Count',
      SUM(accion = 'PAGAR') AS 'Pagar_Count',
      SUM(accion = 'SOLICITAR') AS 'Solicitar_Count',
      SUM(accion = 'REQUISITOS') AS 'Requisitos_Count',
      SUM(accion = 'MENU_NO_CLIENTE') AS 'No_Cliente_Count',
      SUM(accion = 'NUEVO_CLIENTE_REGISTRADO') AS 'Registros_Count',
      SUM(accion = 'MENU_PRINCIPAL') AS 'Home_Count'
    FROM messages
    WHERE DATE(fecha_hora) = CURDATE()
  `;

  connection.query(sql, (error, results) => {
    if (error) throw error;

    let totalMessages = 0;
    let totalPersonas = 0;

    let emailContent = '<h3><strong>Resumen Total:</strong></h3>';
    emailContent += '<table border="1" cellpadding="5" cellspacing="0">';
    emailContent += '<tr><th>Total de Personas</th><th>Total de Mensajes Procesados</th></tr>';
    
    results.forEach(row => {
      totalMessages += row.message_count;
      totalPersonas++;
    });
  
    emailContent += `<tr><td>${totalPersonas}</td><td>${totalMessages}</td></tr>`;
    emailContent += '</table>';
    emailContent += '<hr><hr>';
  
    connection.query(keywordSql, (error, keywordResults) => {
      if (error) throw error;

      emailContent += '<h3>Resumen de palabras clave para el día actual:</strong></h3>';
      emailContent += '<table border="1" cellpadding="5" cellspacing="0">';
      emailContent += '<tr><th>Saldo</th><th>Movimientos</th><th>Prestamo</th><th>Resumen</th><th>Operador</th><th>Promos</th><th>Pagar</th><th>Solicitar</th><th>Requisitos</th><th>No Cliente</th><th>Registros</th><th>Home</th></tr>';
    
      keywordResults.forEach(keywordRow => {
        emailContent += `<tr><td>${keywordRow.Saldo_Count}</td><td>${keywordRow.Movimientos_Count}</td><td>${keywordRow.Prestamo_Count}</td><td>${keywordRow.Resumen_Count}</td><td>${keywordRow.Operador_Count}</td><td>${keywordRow.Promos_Count}</td><td>${keywordRow.Pagar_Count}</td><td>${keywordRow.Solicitar_Count}</td><td>${keywordRow.Requisitos_Count}</td><td>${keywordRow.No_Cliente_Count}</td><td>${keywordRow.Registros_Count}</td><td>${keywordRow.Home_Count}</td></tr>`;
      });

      emailContent += '</table>';
      emailContent += '<h3>Detalle de números de teléfonos:</strong></h3>';
      emailContent += '<table border="1" cellpadding="5" cellspacing="0">';
      emailContent += '<tr><th>Teléfono</th><th>Cantidad de mensajes</th></tr>';

      results.forEach(row => {
        emailContent += `<tr><td>${row.telefono}</td><td>${row.message_count}</td></tr>`;
      });

      emailContent += '</table>';

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
      const mailOptions = {
        from: 'facundogonzalez@tarjetadata.com.ar',
        to: 'facugonza@gmail.com, luispalacio@tarjetadata.com.ar, gabrielperez@tarjetadata.com.ar',
        subject: `Cantidad de Personas Atendidas hoy: (${todayDate})`,
        html: emailContent,
      };

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

const rule = new schedule.RecurrenceRule();
rule.hour = 23;
rule.minute = 59;

const job = schedule.scheduleJob(rule, () => {
  sendEmail();
  console.log('Correo enviado a las 23:59.');
});

console.log('Tarea programada para las 23:59 cada día.');
