module.exports = {
    apps: [
      {
        name: 'botclientes',  // Nombre de la aplicación
        script: './src/app.js',  // Ruta del archivo principal
        instances: 1,  // Número de instancias (clustering)
        autorestart: true,  // Reinicia automáticamente si falla
        watch: false,  // No ver cambios en el código
        //max_memory_restart: '4G',  // Reinicia si usa más de 1GB de memoria
        env_file: './.env',  // Cargar las variables de entorno desde el archivo .env
      },
    ],
  };
  