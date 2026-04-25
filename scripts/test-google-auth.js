/**
 * Script de diagnóstico para verificar autenticación y permisos de Google
 */

const { google } = require('googleapis');
const fs = require('fs');

async function testGoogleAuth() {
  try {
    console.log('🔍 Diagnóstico de Google Cloud\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Verificar archivo de credenciales
    const credentialsPath = './google-credentials.json';
    console.log('1️⃣ Verificando archivo de credenciales...');
    
    if (!fs.existsSync(credentialsPath)) {
      console.log('   ❌ Archivo no encontrado\n');
      return;
    }
    console.log('   ✅ Archivo encontrado\n');

    // 2. Leer y mostrar información del Service Account
    console.log('2️⃣ Información del Service Account:');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log(`   📧 Email: ${credentials.client_email}`);
    console.log(`   🆔 Project ID: ${credentials.project_id}`);
    console.log(`   🔑 Private Key ID: ${credentials.private_key_id.substring(0, 20)}...\n`);

    // 3. Probar autenticación
    console.log('3️⃣ Probando autenticación...');
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file'
      ]
    });

    const authClient = await auth.getClient();
    console.log('   ✅ Autenticación exitosa\n');

    // 4. Probar acceso a Google Sheets API
    console.log('4️⃣ Probando Google Sheets API...');
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    
    try {
      // Intentar crear un spreadsheet simple
      const response = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: 'Test - Puede eliminar este archivo'
          }
        }
      });
      
      console.log('   ✅ Google Sheets API funciona correctamente');
      console.log(`   📊 Spreadsheet creado: ${response.data.spreadsheetId}`);
      console.log(`   🔗 URL: https://docs.google.com/spreadsheets/d/${response.data.spreadsheetId}/edit\n`);
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ TODO FUNCIONA CORRECTAMENTE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('Puedes eliminar el spreadsheet de prueba desde Google Drive\n');
      
    } catch (apiError) {
      console.log('   ❌ Error al usar Google Sheets API\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ PROBLEMA DETECTADO');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('Error:', apiError.message);
      console.log('Código:', apiError.code);
      console.log('\n📋 POSIBLES SOLUCIONES:\n');
      
      if (apiError.code === 403) {
        console.log('1. Verifica que Google Sheets API esté habilitada:');
        console.log('   https://console.cloud.google.com/apis/library/sheets.googleapis.com\n');
        
        console.log('2. Verifica que Google Drive API esté habilitada:');
        console.log('   https://console.cloud.google.com/apis/library/drive.googleapis.com\n');
        
        console.log('3. Verifica los permisos del Service Account:');
        console.log('   - Ve a IAM & Admin > IAM');
        console.log('   - Busca:', credentials.client_email);
        console.log('   - Debe tener rol: Editor u Owner\n');
        
        console.log('4. Si usas Google Workspace, verifica restricciones de dominio\n');
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.error('\nDetalles completos:');
    console.error(error);
  }
}

testGoogleAuth();

// Made with Bob
