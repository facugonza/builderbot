import mysql from 'mysql2';
import nodemailer from 'nodemailer';
import { CronJob } from 'cron';

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

 

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const firstDay = `${year}-${month}-01`;
  const lastDay = new Date(year, month, 0).toISOString().split('T')[0];

  console.log(`📅 Generando reporte desde ${firstDay} hasta ${lastDay}`);

  const sql = `
    SELECT phone, fecha, SUM(message_count) AS total_message_count
    FROM (
        SELECT phone, COUNT(*) AS message_count, DATE(creationDate) as fecha 
        FROM history
        WHERE DATE(creationDate) BETWEEN '${firstDay}' AND '${lastDay}'
        GROUP BY phone, fecha

        UNION ALL

        SELECT telefono AS phone, COUNT(*) AS message_count, DATE(fecha_hora) as fecha
        FROM messages
        WHERE DATE(fecha_hora) BETWEEN '${firstDay}' AND '${lastDay}'
        GROUP BY telefono, fecha
    ) AS combined
    GROUP BY phone, fecha
    ORDER BY total_message_count DESC, fecha DESC;
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
        WHERE DATE(creationDate) BETWEEN '${firstDay}' AND '${lastDay}'

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
        WHERE DATE(fecha_hora) BETWEEN '${firstDay}' AND '${lastDay}'
    ) AS combined_results;
  `;

  connection.query(sql, (error, results) => {
    if (error) {
      console.error("❌ Error en la consulta SQL:", error);
      return;
    }

    console.log("✅ Consulta SQL ejecutada correctamente.");

    let totalMessages = 0;
    let totalPersonas = results.length;

    let emailContent = `<h3><strong>Resumen Total (${firstDay} - ${lastDay}):</strong></h3>`;
    emailContent += `<table border="1" cellpadding="5" cellspacing="0">
        <tr><th>Total de Personas</th><th>Total de Mensajes Procesados</th></tr>
        <tr><td>${totalPersonas}</td><td>${totalMessages}</td></tr>
    </table><hr>`;

    connection.query(keywordSql, (error, keywordResults) => {
      if (error) {
        console.error("❌ Error en la consulta de palabras clave:", error);
        return;
      }

      emailContent += `<h3>Resumen de palabras clave:</h3>
      <table border="1" cellpadding="5" cellspacing="0">
          <tr><th>Saldo</th><th>Movimientos</th><th>Prestamo</th><th>Resumen</th><th>Operador</th><th>Promos</th><th>Pagar</th><th>Solicitar</th><th>Requisitos</th></tr>`;

      keywordResults.forEach(row => {
        emailContent += `<tr>
            <td>${row.Total_Saldo_Count}</td>
            <td>${row.Total_Movimientos_Count}</td>
            <td>${row.Total_Prestamo_Count}</td>
            <td>${row.Total_Resumen_Count}</td>
            <td>${row.Total_Operador_Count}</td>
            <td>${row.Total_Promos_Count}</td>
            <td>${row.Total_Pagar_Count}</td>
            <td>${row.Total_Solicitar_Count}</td>
            <td>${row.Total_Requisitos_Count}</td>
        </tr>`;
      });

      emailContent += `</table><hr>`;

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'databotnotificacion@gmail.com',
          pass: 'uxdrvqmaulcytylz', 
        }
      });

      console.log("📩 Enviando correo...");

      const mailOptions = {
        from: 'databotnotificacion@gmail.com',
        to: 'angelachacongonzalez@gmail.com, facugonza@gmail.com',
        subject: `Resumen DATABOT mensual ${firstDay} - ${lastDay}`,
        html: emailContent,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("❌ Error enviando email:", error);
        } else {
          console.log("✅ Email enviado correctamente:", info.response);
        }
      });

      connection.end();
    });
  });
}

// **Automatización para el último día del mes a las 23:59**
new CronJob(
  '59 23 28-31 * *',
  function () {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    if (now.getDate() === lastDay) {
      console.log("📅 Hoy es el último día del mes, enviando reporte...");
      sendEmail();
    }
  },
  null,
  true,
  'America/Argentina/Buenos_Aires'
);

console.log('📅 Reporte mensual programado para el último día de cada mes a las 23:59 hs.');

//sendEmail(); // 🔥 Forzar el envío manualmente



