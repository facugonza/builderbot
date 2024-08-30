//import dotenv from "dotenv";
//dotenv.config();

console.log("GOOGLE_SERVICE_ACCOUNT_EMAIL   >" + process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
console.log("process.env.GOOGLE_PRIVATE_KEY >"+process.env.GOOGLE_PRIVATE_KEY);

//import { JWT } from "google-auth-library";
//import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { logger, emailLogger } from '../../logger/logger.js';


const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

class GoogleSheetService {
  
  jwtFromEnv = undefined;
  doc = undefined;

  constructor(id = undefined) {
    if (!id) {
      throw new Error("ID_UNDEFINED");
    }

    this.jwtFromEnv = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: SCOPES,
    });
    this.doc = new GoogleSpreadsheet(id, this.jwtFromEnv);
  }

  static excelSerialDateToDate(dateSerial) {
    const utc_days  = Math.floor(dateSerial - 25569);
    const utc_value = utc_days * 86400;                                        
    return new Date(utc_value * 1000);
  }


  
/**
 * Recupera promociones activas de una hoja de Google Sheets.
 * @returns {Array} Lista de promociones activas.
 */
retriveActivePromos = async () => {
  try {
    const list = [];
    await this.doc.loadInfo();
    const sheet = this.doc.sheetsByIndex[0]; // Asumiendo que las promociones están en la segunda hoja
    const rows = await sheet.getRows();
    logger.info("CANTIDAD DE FILAS : " + rows.length);
    await sheet.loadCells('A1:E50');
    
    for (let i = 0; i <= rows.length; i++) {
      const promoName = sheet.getCell(i, 0).value; // Columna A
      const promoDescription = sheet.getCell(i, 1).value; // Columna B
      const startDate = sheet.getCell(i, 2).value; // Columna C
      const endDate = sheet.getCell(i, 3).value; // Columna D
      const promoImage = sheet.getCell(i, 4).value; // Columna E
      /*
      logger.info(">>>>>>>>>>>> FILA PROCESADA : " + i + " >>>>>>>>>>>>>>>>>>>>>>>>><<<<");
      logger.info(`promoName: ${promoName}, Descripcion: ${promoDescription}`);
      logger.info(`imagen: ${promoImage}`);
      logger.info(`startDate: ${startDate}, EndDate: ${endDate}`);
      logger.info(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>><<<<");
      */
     
      if (!promoName || promoName === '') break; 
                
      // Convertir las fechas a objetos Date
      const startDateObj = GoogleSheetService.excelSerialDateToDate(startDate);
      const endDateObj = GoogleSheetService.excelSerialDateToDate(endDate);
      const now = new Date();

      // Verificar si la fecha actual está dentro del rango de la promoción
      if (now >= startDateObj && now <= endDateObj) {
        
        const formattedStartDate = startDateObj.toLocaleDateString('es-AR', {
          day: '2-digit', month: '2-digit', year: 'numeric'
        });

        const formattedEndDate = endDateObj.toLocaleDateString('es-AR', {
          day: '2-digit', month: '2-digit', year: 'numeric'
        });


        console.log(`Fecha Inicio: ${formattedStartDate}, Fecha Fin: ${formattedEndDate}`);
        console.log("*************************************************************************************");
        list.push({
          name: promoName,
          description:promoDescription,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          image:promoImage,
          // Puedes agregar más datos de la promoción aquí si es necesario
        });
      }
    }
    logger.info("list SIZE : " + list.length);

    return list;
  } catch (err) {
      logger.error(err.stack);
      emailLogger("ERROR OBTENIENDO LAS PROMOCIONES DE TARJETA DATA : ",err.stack)
      return undefined;
  }
};

 
}

export default GoogleSheetService;
