import dotenv from 'dotenv';
dotenv.config();

import axios from "axios";
import { emailLogger} from '../../logger/logger.js';
import { getClienteData} from "../../models/clienteDATA.js";
import {setClienteData } from "../../models/clienteDATA.js";
import redisClient from './redisClient.js'; 


const API_URL_VERIFICAR_TELEFONO ="http://200.70.56.202:8080/AppMovil/Cliente?nroTelefono=";
const API_URL_VERIFICAR_TELEFONO_BKP ="http://200.70.56.203:8021/AppMovil/Cliente?nroTelefono=";
const CACHE_TTL = 300; // 5 minutos en segundos

const isRegisterClient = async (phoneNumber) => {
    
    try {
        var config = {
            method: "get",
            url: API_URL_VERIFICAR_TELEFONO + phoneNumber,
            headers: {},
            timeout: 30000
        };

        const response = await axios(config);
        return response.data;
    } catch (e) {
        console.log(e);
        emailLogger.error("ERROR en isRegisterClient > "+ e.stack);
        return null;
    }
};

const findCustomer = async (ctx) => {
    let cliente = getClienteData(ctx);
   
    //REDIS CODE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    const cacheKey = `cliente:${ctx.from}`;
    
    //REDIS CODE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    if (Object.keys(cliente).length === 0) {
        try {
            
            const cachedData = await redisClient.get(cacheKey);

            if (cachedData) {
                console.log("Redis HIT para:", ctx.from);
                cliente = JSON.parse(cachedData);
                setClienteData(ctx, cliente);
                return cliente;
            }
            console.log("Redis MISS para:", ctx.from);
        } catch (err) {
            console.error("Error al acceder a Redis:", err);
            emailLogger.error("Error en Redis: " + err.stack);
        }
    }   

    // Función auxiliar para realizar la solicitud
    async function makeRequest(url) {
        try {

            //REDIS CODE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
            const cachedData = await redisClient.get(cacheKey);

            console.log("INTENTANDO OBTENER DATOS DEL CLIENTE DESDE... : "+ url + ctx.from);
            const config = {
                method: "get",
                url: url + ctx.from,
                headers: {},
                timeout: 30000
            };
            const response = await axios(config);
            return response.data;
        } catch (e) {
            emailLogger.error("ERROR en makeRequest > " + url + ctx.from + " " + e.stack);
            console.log(e);
            return null;
        }
    }

    // Si el objeto cliente está vacío, intenta buscar los datos del cliente
    if (Object.keys(cliente).length === 0) {
        cliente = await makeRequest(API_URL_VERIFICAR_TELEFONO);

        // Si la solicitud al primer servidor falla, intenta con el segundo servidor
        if (!cliente) {
            cliente = await makeRequest(API_URL_VERIFICAR_TELEFONO_BKP);
        }

        // Si se encontraron los datos del cliente y el cliente ha iniciado sesión, almacena los datos en el contexto
        if (cliente !=null && cliente.isLogin) {
            setClienteData(ctx, cliente);
            
            //REDIS CODE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
            try {
                await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(cliente));
            } catch (err) {
                console.error("Error al guardar en Redis:", err);
                emailLogger.error("Error guardando datos en Redis: " + err.stack);
            }
            
        } else {
            cliente = {}; // Asegurarse de devolver un objeto vacío si no se encontraron datos
        }
    }   

    return cliente; // Devuelve el objeto cliente, que puede estar lleno o vacío
};



async function obtenerDisponiblePrestamo(numeroTarjeta, digitoVerificador) {
    try {
        const url = `https://seguro.tarjetadata.com.ar/restventas/servicios/psp/disponible/${numeroTarjeta}/${digitoVerificador}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error al obtener el disponible:', error);
        throw error;
    }
}

const asociarCliente = async (datosCliente) => {
    try {
        console.log("asociarCliente DATOS CLIENTES : " + JSON.stringify(datosCliente));

        var config = {
            method: "POST",
            url: process.env.API_URL_VINCULAR, // Reemplaza con tu URL
            headers: {
                "Content-Type": "application/json",
            },
            data: JSON.stringify(datosCliente),
        };

        const response = await axios(config);
        return response.data;
    } catch (error) {
        emailLogger.log("ERROR VINCULANDO CLIENTE >  : " + error);
        return null;
    }
};


export { isRegisterClient,findCustomer };
