// logger.js
import log4js from 'log4js';


log4js.configure({
    appenders: {
        file: { 
            type: 'file', 
            filename: './logger/databot.log',
            maxLogSize: 1024 * 1024, // Tamaño máximo de 1 MB
            backups: 365 // Conservar un máximo de 10 archivos de log
        },
        console: { type: 'console' },
        email: {
            type: '@log4js-node/smtp',
            recipients: 'facugonza@gmail.com',
            sender: 'facundogonzalez@tarjetadata.com.ar',
            subject: 'ERROR GRAVE EN DATA BOT',
            SMTP: {
                host: 'sd-1973625-l.dattaweb.com',
                secure: true, // use SSL
                port: 465,
                auth: {
                    user: 'facundogonzalez@tarjetadata.com.ar',
                    pass: 'Facundo2000@*'
                }
            }
        }
    },
    categories: {
        default: { appenders: ['file', 'console'], level: 'debug' },
        email: { appenders: ['email'], level: 'error' } // Sólo se enviarán emails para los logs de nivel 'error'
    }
});

const logger = log4js.getLogger(); // Para los logs normales
const emailLogger = log4js.getLogger('email'); // Para los logs que deban enviarse por correo

export {logger,emailLogger};
