import { exec } from 'child_process';
import http from 'http';
import { logger, emailLogger } from '../logger/logger.js';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'databot',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


const checkLastMessageTime = async () => {
    try {
        const [rows] = await pool.query('SELECT MAX(fecha_hora) as lastMessageTime FROM messages');
        const lastMessageTime = new Date(rows[0].lastMessageTime);
        const currentTime = new Date();
        const timeDiff = (currentTime - lastMessageTime) / (1000 * 60); // Diferencia en minutos
        logger.info('Starting to check App Status > ');
        logger.info('currentTime     > ' + currentTime);
        logger.info('lastMessageTime > ' +  lastMessageTime ); 
        logger.info('timeDiff        > ' +  timeDiff );

        if (timeDiff > 5) {
            logger.warn('No se han registrado mensajes en los últimos 15 minutos, reiniciando la aplicación...');
            emailLogger.warn('No se han registrado mensajes en los últimos 15 minutos, reiniciando la aplicación...');
            restartApp();
        } else {
            logger.info('La aplicación está registrando mensajes correctamente.');
        }
    } catch (error) {
        logger.error('Error al verificar el tiempo del último mensaje:', error);
        emailLogger.error('Error al verificar el tiempo del último mensaje:', error);
    }
}

const checkAppStatus = () => {
    exec('pm2 status databot', (err, stdout, stderr) => {
        logger.info("START TO CHECK DATABOT STATUS ....");
        checkHealthEndpoint();
        logger.info("FINISHED CHECK DATABOT STATUS ....");
        /*
        if (err) {
            logger.error(`Error ejecutando pm2 status: ${stderr}`);
            emailLogger.error(`Error ejecutando pm2 status: ${stderr}`);
            return;
        }

        if (stdout.includes('errored') || stdout.includes('stopped')) {
            logger.error('La aplicación está detenida o con errores, reiniciando...');
            emailLogger.error('La aplicación está detenida o con errores, reiniciando...');
            restartApp();
        } else {
            // Verificar el estado de salud de la aplicación
            checkHealthEndpoint();
        }
        */
    });
};

const checkHealthEndpoint = () => {
    const options = {
        hostname: 'localhost',
        port:  3008,
        path: '/health',
        method: 'GET',
        timeout: 30000 // 10 segundos
    };

    const req = http.request(options, (res) => {
        logger.info("STATUS HTTP CODE :" + res.statusCode);
        if (res.statusCode === 200) {
            logger.info('La aplicación está respondiendo correctamente.');
        } else {
            logger.log('La aplicación no está respondiendo correctamente, reiniciando...');
            emailLogger.log('La aplicación no está respondiendo correctamente, reiniciando...');
            restartApp();
        }
    });

    req.on('error', (e) => {
        logger.info('Error al verificar el endpoint de salud, reiniciando...',e);
        emailLogger.info('Error al verificar el endpoint de salud, reiniciando...');
        exec('pm2 restart databot', (err, stdout, stderr) => {
            if (err) {
                logger.error(`Error reiniciando la aplicación: ${stderr}`);
                emailLogger.error(`Error reiniciando la aplicación: ${stderr}`);
                return;
            }
            logger.info('Aplicación reiniciada exitosamente.');
            emailLogger.info('Aplicación reiniciada exitosamente.');
        });
    });

    req.end();
};


const restartApp = () => {
    exec('pm2 restart databot', (err, stdout, stderr) => {
        if (err) {
            logger.error(`Error reiniciando la aplicación: ${stderr}`);
            emailLogger.error(`Error reiniciando la aplicación: ${stderr}`);
            return;
        }
        logger.info('Aplicación reiniciada exitosamente.');
        emailLogger.info('Aplicación reiniciada exitosamente.');
    });
};


// Verificar el estado de la aplicación , verificando el ultim mensaje procesado cada 15 minutos
setInterval(checkLastMessageTime, 10 * 60 * 1000);
//setInterval(checkAppStatus, 15 * 60 * 1000);


// Ejecutar la verificación de inmediato al iniciar el script
checkLastMessageTime();
