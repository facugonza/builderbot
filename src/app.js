import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Convertir import.meta.url a __dirname equivalente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carga el archivo .env desde la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { createBot, createProvider, createFlow, addKeyword, utils } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'

const PORT = process.env.PORT ?? 3008

import flowMain from "../flows/flowMain.js";
import flowAltaCliente from "../flows/flowAltaCliente.js";
import flowValidarCliente from "../flows/flowValidarCliente.js";
import flowNoSoyCliente from '../flows/flowNoSoyCliente.js';
import flowSoyCliente from '../flows/flowSoyCliente.js';
import flowResumen from '../flows/flowResumen.js';
import flowPrincipal from '../flows/flowPrincipal.js';
import flowPrestamosCliente from '../flows/flowPrestamosCliente.js';
import flowPagarCompra from "../flows/flowPagarCompra.js";

import flowDisponible from "../flows/flowDisponible.js";
import flowMovimientos from "../flows/flowCompras.js";
import flowLinkPagoMP from "../flows/flowLinkPagoMP.js";

//process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
import https from 'https';

//const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')
//import { MysqlDB } from '@builderbot/database-mysql'
//const QRPortalWeb = require('@builderbot/bot/portal')
//const BaileysProvider = require('@bot-whatsapp/provider/baileys')
///const MockAdapter = require('@bot-whatsapp/database/mock')

const MYSQL_DB_HOST = "localhost";
const MYSQL_DB_USER = "root";
const MYSQL_DB_PASSWORD = "password";
const MYSQL_DB_NAME = "databot";
const MYSQL_DB_PORT = "3306";

/** 
 *  Globals 
*/
//global.cliente ={};

const main = async () => {
    
    //const adapterDBMock = new MockAdapter();
    /*
    const adapterDB = new MysqlDB({
        host: MYSQL_DB_HOST,
        user: MYSQL_DB_USER,
        database: MYSQL_DB_NAME,
        password: MYSQL_DB_PASSWORD,
        port: MYSQL_DB_PORT,
      });
    */

    const adapterFlow = createFlow([flowMain,flowSoyCliente,flowResumen,flowNoSoyCliente,flowAltaCliente,flowValidarCliente,flowPrincipal,flowPrestamosCliente,flowPagarCompra,flowDisponible,flowLinkPagoMP,flowMovimientos])
    //const adapterProvider = createProvider(BaileysProvider)

    const adapterProvider = createProvider(Provider)
    const adapterDB = new Database()

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })
    
    /*
    adapterProvider.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const  number = "5492644736151";
            const  message = "DATABOT ALIVE";
            urlMedia= null;
            //const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )
    */
    /*
    adapterProvider.server.post(
        '/v1/register',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('REGISTER_FLOW', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/samples',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('SAMPLES', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/blacklist',
        handleCtx(async (bot, req, res) => {
            const { number, intent } = req.body
            if (intent === 'remove') bot.blacklist.remove(number)
            if (intent === 'add') bot.blacklist.add(number)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'ok', number, intent }))
        })
    )
    */
    adapterProvider.server.get('/health', async (req, res) => {
        const  number = "5492644736151";
        const  message = "DATABOT ALIVE";
        try {
            const refProvider = await adapterProvider.getInstance();
            if (refProvider && refProvider.vendor) {
                await refProvider.vendor.sendMessage(number, message); // Usa await para sendMessage
                console.log("Mensaje enviado:", message, "a", number);
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('OK');
            } else {
                console.error("Vendor no inicializado.");
                res.writeHead(503, { 'Content-Type': 'text/plain' });
                res.end('FAIL');
            }
        } catch (error) {
            console.error("Error enviando el mensaje de salud:", error);
            res.writeHead(503, { 'Content-Type': 'text/plain' });
            res.end('FAIL');
        }
    });
 
    
    adapterProvider.server.post('/notifySale', (req, res) => {
        const { number, message } = req.body;
        try {
            console.log("SENDING MESSAGE TO : " + number);
            adapterProvider.sendMessage(number, message, { media: null });
            console.log("MESSAGE SENT: " + "SALE DATA" + " to " + number);
    
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('OK');
        } catch (error) {
            res.writeHead(503, { 'Content-Type': 'text/plain' });
            res.end('FAIL');
        }
    });

    adapterProvider.server.post('/recibirventa', async (req, res) => {
        //const  number = "5492644736151";
        //const  message = "DATABOT ALIVE";
        const { number,message } = req.body;
        try {
            const refProvider = await adapterProvider.getInstance();
            if (refProvider && refProvider.vendor) {
                await refProvider.vendor.sendMessage(number, message); // Usa await para sendMessage
                console.log("Mensaje enviado:", message, "a", number);
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('OK');
            } else {
                console.error("Vendor no inicializado.");
                res.writeHead(503, { 'Content-Type': 'text/plain' });
                res.end('FAIL');
            }
        } catch (error) {
            console.error("Error enviando el mensaje de salud:", error);
            res.writeHead(503, { 'Content-Type': 'text/plain' });
            res.end('FAIL');
        }
    });

    // Inicia el servidor HTTP
    httpServer(+PORT);
}

main();
