import { exec } from 'child_process';
import http from 'http';
import { logger, emailLogger } from '../logger/logger.js';

const checkAppStatus = () => {
    exec('pm2 status whatsapp-bot', (err, stdout, stderr) => {
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
        exec('pm2 restart whatsapp-bot', (err, stdout, stderr) => {
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
    exec('pm2 restart whatsapp-bot', (err, stdout, stderr) => {
        if (err) {
            logger.error(`Error reiniciando la aplicación: ${stderr}`);
            emailLogger.error(`Error reiniciando la aplicación: ${stderr}`);
            return;
        }
        logger.info('Aplicación reiniciada exitosamente.');
        emailLogger.info('Aplicación reiniciada exitosamente.');
    });
};


// Verificar el estado de la aplicación cada 5 minutos
setInterval(checkAppStatus, 10 * 60 * 1000);

// Ejecutar la verificación de inmediato al iniciar el script
checkAppStatus();
