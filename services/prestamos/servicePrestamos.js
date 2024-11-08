// servicePrestamos.js
//const fs = require('fs');
import axios from 'axios';
import https from 'https';
import { emailLogger } from '../../logger/logger.js';

const axiosInstance = axios.create({
    httpsAgent: new https.Agent({  
      rejectUnauthorized: false, // Desactiva la verificación de SSL
    }),
    headers: {
        'Content-Type': 'application/json', // Ajusta según lo que requiera el servidor
        // ... otros encabezados ...
      }    
  });

//  const API_BASE_URL = 'https://seguro.tarjetadata.com.ar/restventas/servicios/psp';
//  const API_BASE_URL = 'https://pruebas.tarjetadata.com.ar/restventas/servicios/psp';
const API_BASE_URL = 'https://seguro.tarjetadata.com.ar/restventas/servicios/chatbot';
const API_HEADERS = {
    'id-cliente': '104' // Reemplaza con el id-cliente apropiado *104 ANTES*
};


async function testConexion() {
    try {        
        const response = await axiosInstance.get(`${API_BASE_URL}/test`, { headers: API_HEADERS });
        return response.data;
    } catch (error) {
        console.error('Error al realizar la prueba de conexión:', error);
        throw error;
    }
}

async function obtenerCuotasHabilitadas() {
    try {
        const response = await axiosInstance.get(`${API_BASE_URL}/plan`, { headers: API_HEADERS });
        return response.data;
    } catch (error) {
        console.error('Error al obtener cuotas habilitadas:', error);
        throw error;
    }
}

async function calcularFinanciacion(capital, cuotas, vencimiento) {
    try {
        //console.log("**********************************************************************************");
        //console.log(capital);
        //console.log(cuotas);
        //console.log(vencimiento);
        //console.log("**********************************************************************************");

        const data = {
            capital: capital,
            cuotas: cuotas,
            vencimiento: vencimiento
        };

        //console.log("**********************************************************************************");
        //console.log(data);
        //console.log("**********************************************************************************");

        const response = await axiosInstance.get(`${API_BASE_URL}/financiacion`, {
            headers: {
                'id-cliente': '104',
                'Content-Type': 'application/json'
            },
            data: data 
        });
        //console.log("**********************************************************************************");
        //console.log(response.data);
        //console.log("**********************************************************************************");
        return response.data;
    } catch (error) {
        console.error('Error al calcular la financiación:', error);
        throw error;
    }
}

async function otorgarPrestamo(tarjeta, digito, version, adicional, capital, cuotas) {
    try {
        const data = {
            tarjeta: tarjeta,
            digito: digito,
            version: version,
            adicional: adicional,
            capital: capital,
            cuotas: cuotas
        };

        const response = await axiosInstance.post(`${API_BASE_URL}/insertar/sinbaja`, data, { headers: API_HEADERS });
        console.log("Respuesta del servidor al otorgar el préstamo:", response.data);
        return response.data;
    } catch (error) {
        emailLogger.error('Error al otorgar el préstamo:', error);
        throw error;
    }
}

export  {  testConexion,    obtenerCuotasHabilitadas,    calcularFinanciacion,    otorgarPrestamo };
