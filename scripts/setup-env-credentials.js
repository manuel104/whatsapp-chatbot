/**
 * Script para agregar las credenciales de Google al .env.local
 */

const fs = require('fs');
const path = require('path');

// Leer google-credentials.json
const credentialsPath = path.join(__dirname, '..', 'google-credentials.json');
const envPath = path.join(__dirname, '..', '.env.local');

try {
  // Leer credenciales
  const credentials = fs.readFileSync(credentialsPath, 'utf8');
  
  // Convertir a una sola línea (eliminar saltos de línea)
  const credentialsOneLine = credentials.replace(/\n/g, '').replace(/\r/g, '');
  
  // Leer .env.local actual
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Verificar si ya existe GOOGLE_SERVICE_ACCOUNT_KEY
  if (envContent.includes('GOOGLE_SERVICE_ACCOUNT_KEY=')) {
    // Reemplazar la línea existente
    envContent = envContent.replace(
      /GOOGLE_SERVICE_ACCOUNT_KEY=.*/,
      `GOOGLE_SERVICE_ACCOUNT_KEY=${credentialsOneLine}`
    );
  } else {
    // Agregar al final
    envContent += `\nGOOGLE_SERVICE_ACCOUNT_KEY=${credentialsOneLine}\n`;
  }
  
  // Escribir de vuelta
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ Credenciales de Google agregadas exitosamente a .env.local');
  console.log('📝 Reinicia el servidor (npm run dev) para que los cambios surtan efecto');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nAsegúrate de que:');
  console.error('1. El archivo google-credentials.json existe');
  console.error('2. El archivo .env.local existe');
  process.exit(1);
}

// Made with Bob
