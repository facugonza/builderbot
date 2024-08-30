// test-env.js

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Convertir import.meta.url a __dirname equivalente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carga el archivo .env desde la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Verifica si las variables se cargaron correctamente
console.log("GOOGLE_SERVICE_ACCOUNT_EMAIL:", process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
console.log("GOOGLE_PRIVATE_KEY:", process.env.GOOGLE_PRIVATE_KEY ? "Cargada correctamente" : "No cargada o es undefined");

// Si necesitas ver el valor completo de GOOGLE_PRIVATE_KEY, puedes descomentar la siguiente línea:
// console.log("GOOGLE_PRIVATE_KEY:", process.env.GOOGLE_PRIVATE_KEY);

// Verifica si la clave privada se puede formatear correctamente
if (process.env.GOOGLE_PRIVATE_KEY) {
    const formattedKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
    console.log("GOOGLE_PRIVATE_KEY formateada:", formattedKey);
} else {
    console.error("GOOGLE_PRIVATE_KEY no está definida o es undefined");
}
