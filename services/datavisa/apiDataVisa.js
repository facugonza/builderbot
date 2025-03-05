import axios from 'axios'; 
import https from 'https'; 


const apiDataVisa = {};

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  })
});

/**
 * Genera un link de pago con el Botón de Pago Simple VISA DATA - BIND.
 * @param {object} paymentData - Datos del pago.
 * @returns {string|null} URL del link de pago generado.
 */
apiDataVisa.generatePaymentLink = async function(paymentData) {
    try {
        // Validar que los datos obligatorios estén presentes
        if (!paymentData.totalAmount) {
            throw new Error("El parámetro 'totalAmount' es obligatorio.");
        }
        
        // Configurar los datos para la solicitud
        const requestData = {
            collector_cuit: "20322678275",  // Obligatorio
            collector_branchOffice: 3242,  // Obligatorio
            description: paymentData.description || "Pago de Tarjeta DATA-VISA", // Obligatorio
            totalAmount: paymentData.totalAmount,  // Obligatorio
            currency: "ARS",  // Obligatorio
            channel: 1,  // Obligatorio
            clientReference: paymentData.clientReference || `${Date.now()}`, // Obligatorio (generado si no se envía)
            
        };

        // Enviar solicitud al endpoint
        const response = await axiosInstance.post(
            'https://pruebas.tarjetadata.com.ar/restbind/servicios/bind/boton/simple/pago',
            requestData,
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        // Retornar la URL del pago
        return response.data.url;  

    } catch (error) {
            console.error("❌ Error generando link de pago:");
        
            if (error.response) {
                // La API respondió con un error (HTTP 4xx o 5xx)
                console.error("🔴 Status Code:", error.response.status);
                console.error("📌 Respuesta del servidor:", JSON.stringify(error.response.data, null, 2));
            } else if (error.request) {
                // No hubo respuesta del servidor
                console.error("⚠️ No se recibió respuesta del servidor:", error.request);
            } else {
                // Otro tipo de error
                console.error("❗ Error desconocido:", error.message);
            }
        
            return null;
        }
        
    };

export default apiDataVisa;

