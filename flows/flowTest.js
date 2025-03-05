import apiDataVisa from '../services/datavisa/apiDataVisa.js';

async function testGeneratePayment() {
    const paymentData = {
        description: "Pago de prueba",
        totalAmount: 15000.50,  // ⚠️ Este valor es obligatorio
        expirationDate: "2025-12-31T23:59:59.0000000",
        successUrl: "https://home.tarjetadata.com.ar/",
        errorUrl: "https://home.tarjetadata.com.ar/error",
        clientReference: "123456789",
        items: [
            {
                amount: 15000.50,
                description: "Pago de servicio",
                quantity: 1
            }
        ]
    };

    try {
        console.log("⏳ Generando link de pago...");
        const paymentLink = await apiDataVisa.generatePaymentLink(paymentData);

        if (paymentLink) {
            console.log("✅ Link de pago generado con éxito:");
            console.log(paymentLink);
        } else {
            console.log("❌ No se pudo generar el link de pago.");
        }
    } catch (error) {
        console.error("❌ Error en la prueba:", error);
    }
}

testGeneratePayment();
