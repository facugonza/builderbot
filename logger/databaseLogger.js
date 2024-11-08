import mysql from 'mysql2';
import { logger } from '../logger/logger.js';

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'databot',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

function addLog(telefono, accion) {
    try{
        const sql = `INSERT INTO messages (telefono, accion) VALUES (?, ?)`;
        const params = [telefono, accion];

        pool.execute(sql, params, (error, results) => {
            if (error) {
                logger.error('Error al insertar en la base de datos', error);
                return;
            }
            logger.log('Registro insertado:', results.insertId);
        });
    }catch(error){
        logger.error(error);
    }
}

export default {  addLog };