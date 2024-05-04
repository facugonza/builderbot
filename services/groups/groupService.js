// groupService.js
const mysql = require('mysql2');

const MYSQL_DB_HOST = "localhost";
const MYSQL_DB_USER = "root";
const MYSQL_DB_PASSWORD = "password";
const MYSQL_DB_NAME = "databot";


const connection = mysql.createConnection({
  host: MYSQL_DB_HOST,
  user: MYSQL_DB_USER,
  password: MYSQL_DB_PASSWORD,
  database: MYSQL_DB_NAME
});

connection.connect(err => {
  if (err) {
    console.error('Error al conectar: ' + err.stack);
    return;
  }

  console.log('Conectado con el identificador ' + connection.threadId);
});

const createGroup = (clientetelefono, whatsappgroupid, groupcode) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO grupos (CLIENTETELEFONO, WHATSAPPGROUPID, GROUPCODE) VALUES (?, ?, ?)`;

    connection.query(query, [clientetelefono, clientedni,  whatsappgroupid, groupcode], (error, results) => {
      if (error) {
        return reject(error);
      }
      console.log('Grupo insertado, ID:', results.insertId);
      resolve(results.insertId);
    });
  });
};

module.exports = { createGroup };
