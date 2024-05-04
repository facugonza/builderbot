const { logger, emailLogger } = require('../logger/logger');

// mercadoPago.js
const mercadopago = require('mercadopago');

// Configura tu access_token
mercadopago.configure({
     // 'TEST-1732050863587846-070619-36d23ea2a991454577262d1270a5437a-9562808' FACUGONZA
    access_token: 'TEST-915020181160380-062908-347359ef0bb4861b4e05e962c11173d9-280229259' // DATALATIENDA
});

async function createPaymentLink(title, unit_price,customerId,paymentOption,barcode) {
    let preference = {
        items: [
            {
                title: title,
                unit_price: unit_price,
                quantity: 1,
                picture_url: 'https://datalatienda.com/modules/data2000napse/views/img/datapago-tn.png'
            }
        ],

        external_reference: JSON.stringify({
            customerId: customerId,
            invoiceOption: paymentOption,
            invoiceBarcode: barcode
        }),        

        payment_methods: {
            excluded_payment_types: [
                { id: 'credit_card' },
                { id: 'ticket' },
                { id: 'atm' }
            ],
            installments: 1
        },
        notification_url: 'http://200.70.56.203:8021/AppMovil/WebHookDataBot'
    };

    try {
        logger.info("*****************MERCADO PAGO REQUEST***************");
        logger.info(preference);
        logger.info("****************************************************");
        let response = await mercadopago.preferences.create(preference);
        return response.body.init_point;
    } catch (error) {
        logger.error(error);
        emailLogger.error(error);
        throw error;
    }
}

module.exports = createPaymentLink;
