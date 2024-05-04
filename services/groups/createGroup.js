import axios from "axios";

const createGroup = (numeroTelefono, whatsappId, groupCode, clienteDNI) => {
  const params = new URLSearchParams({
    nroTelefono: numeroTelefono,
    whatsappId: whatsappId,
    groupCode: groupCode,
    clienteDNI: clienteDNI
  });

  const url = `http://200.70.56.203:8021/AppMovil/GroupsController?${params.toString()}`;
  console.log(url);
  return axios.post(url)
    .then(response => {
      console.log('Respuesta del servidor:', response.data);
      return response.data; // Retorna los datos de la respuesta
    })
    .catch(error => {
      console.error('Error al realizar la petición:', error);
      throw error; // Lanza el error para manejarlo más adelante si es necesario
    });
};

export default createGroup;
