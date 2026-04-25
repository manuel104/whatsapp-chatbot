/**
 * Script para crear las 8 hojas (pestañas) en el Google Sheet
 */

const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

const SHEET_NAMES = [
  'PRODUCTOS',
  'CATEGORIAS',
  'VENTAS',
  'INFO_TIENDA',
  'MENSAJES',
  'BOTONES',
  'METODOS_PAGO',
  'CONFIGURACION'
];

async function setupSheetTabs() {
  try {
    console.log('🚀 Creando hojas en Google Sheet...\n');

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    if (!spreadsheetId) {
      console.error('❌ Error: GOOGLE_SHEETS_SPREADSHEET_ID no está configurado');
      process.exit(1);
    }

    // Autenticar
    const auth = new google.auth.GoogleAuth({
      keyFile: './google-credentials.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    console.log('✅ Autenticación exitosa\n');

    // Obtener hojas existentes
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = spreadsheet.data.sheets.map(s => s.properties.title);
    
    console.log('📋 Hojas existentes:', existingSheets.join(', '), '\n');

    // Crear las hojas que faltan
    const requests = [];
    
    for (const sheetName of SHEET_NAMES) {
      if (!existingSheets.includes(sheetName)) {
        console.log(`   Creando hoja: ${sheetName}`);
        requests.push({
          addSheet: {
            properties: {
              title: sheetName,
              gridProperties: {
                rowCount: 100,
                columnCount: 10
              }
            }
          }
        });
      } else {
        console.log(`   ✓ ${sheetName} ya existe`);
      }
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests }
      });
      console.log(`\n✅ ${requests.length} hojas creadas exitosamente\n`);
    } else {
      console.log('\n✅ Todas las hojas ya existen\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ¡Hojas configuradas correctamente!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 PRÓXIMO PASO:\n');
    console.log('Ejecuta el script para llenar las hojas con datos:');
    console.log('   node scripts/fill-google-sheet.js\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Detalles:', error.response.data);
    }
    process.exit(1);
  }
}

setupSheetTabs();

// Made with Bob
