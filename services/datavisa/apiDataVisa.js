const axios = require('axios');
const https = require('https');
//const { logger, emailLogger } = require('../logger/logger');

const apiDataVisa = {};

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  })
});

apiDataVisa.getToken = async function() {
    try {
        const response = await axiosInstance.post('https://pruebas.tarjetadata.com.ar/restdatacashin/datarecursos/servicio/autorizar/client/auth/', {
            username: '104',
            password: 'data2023'
        });
        return response.data.access_token;
    } catch (error) {
        console.error(error);
        //logger.error(error);
        //emailLogger.error(error);
    }
};

apiDataVisa.queryDebt = async function(token, id_clave) {
    try {
        const response = await axiosInstance.post(
            'https://pruebas.tarjetadata.com.ar/restdatacashin/datarecursos/api/factura/rapipago/datavisa/consulta', 
            {
                id_clave: id_clave,
                cod_trx: '0000001',
                canal: 'chatbot',
                fecha_hora_operacion: '2023-08-31 08:00:00'
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error(error);
        //logger.error(error);
        //emailLogger.error(error);
    }
};

module.exports = apiDataVisa;
