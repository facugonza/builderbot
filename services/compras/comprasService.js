import dotenv from "dotenv";
dotenv.config();

import { logger, emailLogger } from  '../../logger/logger.js';;
import axios from "axios";

async function generarRequestId() {
    const fecha = new Date();
    const formatoFechaHora = 
        String(fecha.getDate()).padStart(2, '0') + // Día (dd)
        String(fecha.getMonth() + 1).padStart(2, '0') + // Mes (MM)
        fecha.getFullYear() + // Año (yyyy)
        String(fecha.getHours()).padStart(2, '0') + // Hora (HH)
        String(fecha.getMinutes()).padStart(2, '0') + // Minutos (mm)
        String(fecha.getSeconds()).padStart(2, '0'); // Segundos (ss)
        String(fecha.getMilliseconds()).padStart(2, '0'); // Segundos (ss)
    
    return `${formatoFechaHora}`; // Formato: tarjeta-fechaHora
  }
  
  // Función para verificar si Plan D está activo en el JSON del comercio
  function findPlanActiveByComercio(comercio, numeroComercio) {
    if (!comercio || !comercio.planes) {
      console.log("El comercio o los planes no existen:", comercio);
      return 0; // Retorna 0 si no existen planes
    }
  
    // Primero verificar si existe el plan 53 (Plan D)
    const hasPlanD = comercio.planes.find(plan => plan.planesPK.clavepln === 53);
    if (hasPlanD) {
      return 53;
    }
  
    // Si no tiene plan 53, verificar el plan 1
    const hasPlan1 = comercio.planes.find(plan => plan.planesPK.clavepln === 1);
    if (hasPlan1) {
      return 1;
    }
  
    const comercioAutorizados = [21, 4840, 4500, 5000];
    if (comercioAutorizados.includes(Number(numeroComercio))) {
      const hasPlan2 = comercio.planes.some(plan => {
        
        return plan.planesPK.clavepln === 2;
      });
  
      if (hasPlan2) return 2;
    }
  
    return 0; // Si no tiene ninguno de los planes anteriores, retornar 0
  }
  
  
  // Función para procesar la venta
  // Función para procesar la compra con manejo de reintentos
async function procesarCompra(cliente, state) {
    const dni = cliente.documento;
    const requestId = await generarRequestId();
    const compra = state.get("venta");
    const importeCompra = state.get("importeCompra");
  
    const compraQREstatico = {
      tipo_user_id: 9,
      tipo_user: "APP_QR",
      request_id: requestId,
      documento: dni,
      plastico: cliente.plastico.replace(/\s+/g, '').trim(),
      vtoplastico: cliente.vtotarjeta,
      cuitcomercio: compra.comercio.puntos[0].cuitxpto,
      empresa: compra.numeroComercio,
      puntovta: 1,
      numcaja: 1,
      total: importeCompra,
      planvta: compra.planActivo,
      cuotasvta: compra.cuotasSeleccionadas,
      fecha: new Date().toISOString(),
      observacionvta: "VENTA_API_REST_DATABOT",
      token: "",
    };
  
    // Función auxiliar para realizar la solicitud
    async function makeRequest(url) {
      try {
        logger.info("Intentando procesar compra en: " + url);
        const response = await axios.post(url, compraQREstatico, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        return response.data;
      } catch (e) {
        emailLogger.error("Error en makeRequest > " + e.stack);
        console.log(e);
        return null;
      }
    }
  
    // Realiza la solicitud principal y, si falla, intenta con la URL de respaldo
    logger.info("process.env.API_URL_COMPRAR > "+ process.env.API_URL_COMPRAR) ; 
    let data = await makeRequest(process.env.API_URL_COMPRAR);
    if (!data) {
        logger.info("process.env.API_URL_COMPRAR_BKP > "+ process.env.API_URL_COMPRAR_BKP) ; 
        data = await makeRequest(process.env.API_URL_COMPRAR_BKP);
    }
  
    // Maneja la respuesta de la compra
    if (data && data.error_code === 1) {
      logger.info('Compra procesada exitosamente:', data);
      const messageSuccess = {
        num_autorizacion: data.num_autorizacion,
        success: true,
        message: `*Operación exitosa.* Código de autorización N°: ${data.num_autorizacion}.`
      };
      
      logger.info("messageSuccess >> " + messageSuccess);
      return messageSuccess;
    } else {
      logger.error('Error en la compra:', data || 'Sin respuesta de ambos servidores');
      const messageFail =  {
        success: false,
        message: `*Operación fallida. No se pudo completar la operación. Reintenta luego o contacta a un operador!*`
      };
      return messageFail;
    }
  }
  async function findComercio(numeroComercio) {
    async function findComercioRequest(url) {
      try {
        logger.info("Intentando obtener datos de comercio en: " + url);
        const config = {
          method: "post",
          url: url + numeroComercio,
          headers: {},
          timeout: 30000
        };
        const response = await axios(config);
        return response.data;
      } catch (e) {
        emailLogger.error("Error en makeRequest > " + e.stack);
        return null;
      }
    }
  
    let comercioData = await findComercioRequest(process.env.API_URL_COMERCIO_GET);
    if (!comercioData) {
      logger.info("process.env.API_URL_COMERCIO_GET_BKP > " + process.env.API_URL_COMERCIO_GET_BKP);
      comercioData = await findComercioRequest(process.env.API_URL_COMERCIO_GET_BKP);
    }
  
    if (comercioData) {
      //logger.info("Datos de comercio obtenidos correctamente:", comercioData);
      return comercioData;
    } else {
      logger.warn("No se pudo obtener datos del comercio con ambas URLs.");
      return null;
    }
  }
  

  export { findComercio,findPlanActiveByComercio,procesarCompra};