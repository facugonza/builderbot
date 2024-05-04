let clienteData = {};
const clientesData = {};

const setClienteData = (ctx, data) => {
  const from = ctx.from;
  clientesData[from] = data;
};

const getClienteData = (ctx) => {
  const from = ctx.from;
  return clientesData[from] || {};
};

export  {  setClienteData,  getClienteData };




/*

{
  "isLogin": true,
  "apellido": "GONZALEZ",
  "perfilimagen": "",
  "resumentotal": "9467.02",
  "disponibleprestamo": 114713,
  "Parametro": [],
  "idreserva": 0,
  "barcodeminimo": "7182160968130251122037868103",
  "documento": 27075033,
  "resumennumero": "16096813",
  "Compra": [
    {
      "total": 1990,
      "fecha": "29/10/21",
      "empresa": "MAXI BRANT E-COMMERCE"
    },
    {
      "total": 5,
      "fecha": "17/10/21",
      "empresa": "MAXI BRANT E-COMMERCE"
    },
    {
      "total": 1,
      "fecha": "16/10/21",
      "empresa": "MAXI BRANT E-COMMERCE"
    },
    {
      "total": 0.6,
      "fecha": "16/08/21",
      "empresa": "SPORT BRANT"
    }
  ],
  "resumenminimo": "3786.81",
  "disponible": "120000.00",
  "tarjeta": "117273",
  "barcodepland": "",
  "resumenfecha": "10/11/2022",
  "nombre": "ALBERTO FACUNDO",
  "fechaserver": "01/05/2023",
  "email": "Facugonza@gmail.com",
  "vencimiento": "20/05/2024",
  "diavencimiento": "10",
  "estadocuenta": "M",
  "idturno": 0,
  "barcodetotal": "7181160968130251122094670206",
  "digito": "5"
}

*/