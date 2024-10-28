import dotenv from "dotenv";
dotenv.config();

import { addKeyword, EVENTS } from '@builderbot/bot';
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
  async function procesarCompra(cliente, state) {
    const tarjeta = cliente.tarjeta; 
    const dni = cliente.documento;
  
    // Asignar el request_id usando el DNI y la fecha
    const requestId = generarRequestId(tarjeta);
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
      planvta: compra.planActivo, // Plan D o 1 cuota
      cuotasvta: 1, // Cuotas según Plan D o 1
      fecha: new Date().toISOString(),
      observacionvta: "API_REST_34_APPMOVILE_QR",
      token: "",
    };
  
    console.log('JSON DE LA COMPRA > :', compraQREstatico);
  
    try {
      const response = await axios.post('http://200.70.56.203:8021/AppMovil/ApiComercioVenta', compraQREstatico, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
  
      const data = response.data;
      if (data.error_code === 1) {
        logger.info('Compra procesada exitosamente:', data);
        return {
          success: true,
          message: `*Operación exitosa.* Código de autorización N° : ${data.num_autorizacion}.`
        };
      } else {
        logger.error('Error en la compra:', data);
        return {
          success: false,
          message: `*Operación fallida. No se pudo completar la operación. Reintenta Luego o contacta a un operador!* '}`
        };
      }    
    } catch (error) {
      emailLogger.error('Error al procesar la venta:', error);
    }
  }
  async function findComercio(numeroComercio) {
    try {
      console.log("entre a findcomercio");
      const apiUrl = process.env.API_URL_COMERCIO_GET;
      if (!apiUrl) {
        console.log("ERROR: API_URL_COMERCIO_GET no está definido en el archivo .env o está vacío");
        return null;
      }
  
      const fullUrl = apiUrl.endsWith('/') ? apiUrl + numeroComercio : apiUrl + numeroComercio;
      console.log("URL completa para solicitud de comercio:", fullUrl);
      if (!fullUrl.startsWith("http")) {
        console.log("ERROR: La URL generada no es válida, revisa la configuración del archivo .env");
        return null;
      }
  
      var config = {
        method: "post",  // Cambiado a POST
        url: fullUrl,
        headers: {},
      };
  
      const response = await axios(config);
      console.log("Número de comercio solicitado:", numeroComercio);
  
      if (response.status !== 200) {
        console.log("Error en la solicitud: código de estado", response.status);
        return null;
      }
      return response.data;
    } catch (e) {
      console.log("Error al hacer la solicitud:", e.message);
      emailLogger.error("ERROR flowMain isRegisterClient > " + e.stack);
      return null;
    }  
  }

  export { findComercio,findPlanActiveByComercio, generarRequestId};