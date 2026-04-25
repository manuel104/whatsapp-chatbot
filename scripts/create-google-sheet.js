/**
 * Script para crear Google Sheet con estructura completa de la tienda
 * 
 * REQUISITOS PREVIOS:
 * 1. Crear proyecto en Google Cloud Console
 * 2. Habilitar Google Sheets API
 * 3. Crear Service Account
 * 4. Descargar credenciales JSON
 * 5. Configurar variables de entorno
 * 
 * USO:
 * node scripts/create-google-sheet.js
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Colores para las hojas (en formato hexadecimal)
const SHEET_COLORS = {
  PRODUCTOS: { red: 0.89, green: 0.95, blue: 0.99 },      // Azul claro
  CATEGORIAS: { red: 0.91, green: 0.96, blue: 0.91 },     // Verde claro
  VENTAS: { red: 1, green: 0.98, blue: 0.77 },            // Amarillo claro
  INFO_TIENDA: { red: 1, green: 0.88, blue: 0.7 },        // Naranja claro
  MENSAJES: { red: 0.95, green: 0.9, blue: 0.96 },        // Morado claro
  BOTONES: { red: 0.99, green: 0.89, blue: 0.93 },        // Rosa claro
  METODOS_PAGO: { red: 0.88, green: 0.97, blue: 0.98 },   // Cyan claro
  CONFIGURACION: { red: 0.96, green: 0.96, blue: 0.96 }   // Gris claro
};

// Datos de ejemplo para cada hoja
const SHEET_DATA = {
  PRODUCTOS: {
    headers: ['id', 'nombre', 'precio', 'stock', 'categoria', 'descripcion', 'imagen_url', 'activo'],
    rows: [
      ['P001', 'Camiseta Básica Blanca', 45000, 15, 'Ropa', 'Camiseta 100% algodón, talla M', 'https://ejemplo.com/img1.jpg', 'SI'],
      ['P002', 'Pantalón Jean Azul', 89000, 8, 'Ropa', 'Jean clásico azul oscuro, talla 32', 'https://ejemplo.com/img2.jpg', 'SI'],
      ['P003', 'Zapatos Deportivos Nike', 120000, 5, 'Calzado', 'Zapatos running Nike Air, talla 42', 'https://ejemplo.com/img3.jpg', 'SI'],
      ['P004', 'Gorra Snapback Negra', 35000, 20, 'Accesorios', 'Gorra ajustable color negro', 'https://ejemplo.com/img4.jpg', 'SI'],
      ['P005', 'Reloj Digital Casio', 150000, 3, 'Accesorios', 'Reloj digital resistente al agua', 'https://ejemplo.com/img5.jpg', 'SI'],
      ['P006', 'Chaqueta Deportiva', 95000, 0, 'Ropa', 'Chaqueta impermeable talla L', 'https://ejemplo.com/img6.jpg', 'NO']
    ]
  },
  CATEGORIAS: {
    headers: ['nombre', 'descripcion', 'emoji'],
    rows: [
      ['Ropa', 'Prendas de vestir para toda ocasión', '👕'],
      ['Calzado', 'Zapatos y sandalias de calidad', '👟'],
      ['Accesorios', 'Complementos y accesorios de moda', '🎒'],
      ['Electrónica', 'Dispositivos y gadgets tecnológicos', '📱']
    ]
  },
  VENTAS: {
    headers: ['id_venta', 'fecha', 'cliente_tel', 'cliente_nombre', 'productos', 'total', 'estado', 'factura_url'],
    rows: [
      // Vacío - se llenará automáticamente con las ventas
    ]
  },
  INFO_TIENDA: {
    headers: ['campo', 'valor'],
    rows: [
      ['nombre_tienda', 'Fashion Store Colombia'],
      ['horario', 'Lun-Sab 9am-7pm, Dom 10am-2pm'],
      ['direccion', 'Calle 123 #45-67, Bogotá, Colombia'],
      ['telefono', '+57 300 123 4567'],
      ['email', 'ventas@fashionstore.com'],
      ['envio_gratis_min', '100000'],
      ['metodos_pago', 'Efectivo, Nequi, Bancolombia, Daviplata'],
      ['tiempo_entrega', '2-3 días hábiles'],
      ['moneda', 'COP'],
      ['simbolo_moneda', '$']
    ]
  },
  MENSAJES: {
    headers: ['clave', 'mensaje'],
    rows: [
      ['bienvenida', '👋 ¡Hola {nombre}! Bienvenido a {tienda}. ¿En qué puedo ayudarte hoy?'],
      ['menu_principal', '¿Qué deseas hacer?'],
      ['producto_agregado', '✅ {producto} agregado al carrito exitosamente'],
      ['carrito_vacio', '🛒 Tu carrito está vacío. ¡Empieza a comprar!'],
      ['pedido_confirmado', '✅ ¡Pedido confirmado! Tu número de factura es #{factura}'],
      ['sin_stock', '❌ Lo sentimos, {producto} está agotado en este momento'],
      ['error_general', '⚠️ Ocurrió un error. Por favor intenta de nuevo'],
      ['despedida', '👋 ¡Gracias por tu compra! Vuelve pronto a {tienda}'],
      ['selecciona_categoria', '📦 Selecciona una categoría para ver los productos:'],
      ['escribe_busqueda', '🔍 Escribe el nombre del producto que buscas:'],
      ['producto_no_encontrado', '❌ No encontramos productos con ese nombre. Intenta con otro término'],
      ['confirmacion_compra', '📋 Confirma tu pedido:\\n\\n📦 Productos: {cantidad} items\\n💰 Total: {total}\\n🚚 Envío: {envio}\\n📍 Entrega: {tiempo_entrega}'],
      ['selecciona_pago', '💳 Selecciona tu método de pago:'],
      ['gracias_compra', '🎉 ¡Gracias por tu compra, {nombre}! Nos contactaremos pronto para coordinar la entrega']
    ]
  },
  BOTONES: {
    headers: ['id_boton', 'texto', 'emoji'],
    rows: [
      ['ver_productos', 'Ver Productos', '🛍️'],
      ['buscar', 'Buscar', '🔍'],
      ['mi_carrito', 'Mi Carrito', '🛒'],
      ['ayuda', 'Ayuda', '❓'],
      ['finalizar_compra', 'Finalizar', '✅'],
      ['vaciar_carrito', 'Vaciar', '🗑️'],
      ['seguir_comprando', 'Seguir', '⬅️'],
      ['volver_menu', 'Menú', '🏠'],
      ['volver_categorias', 'Categorías', '🔙'],
      ['agregar_carrito', 'Agregar', '➕'],
      ['quitar_carrito', 'Quitar', '➖'],
      ['eliminar_producto', 'Eliminar', '🗑️']
    ]
  },
  METODOS_PAGO: {
    headers: ['id', 'nombre', 'emoji', 'instrucciones'],
    rows: [
      ['efectivo', 'Efectivo', '💵', 'Pago contra entrega. Prepara el monto exacto'],
      ['nequi', 'Nequi', '📱', 'Enviar a: 300-123-4567 a nombre de Fashion Store'],
      ['bancolombia', 'Bancolombia', '🏦', 'Cuenta Ahorros: 123-456789-01 a nombre de Fashion Store'],
      ['daviplata', 'Daviplata', '💳', 'Enviar a: 320-987-6543 a nombre de Fashion Store']
    ]
  },
  CONFIGURACION: {
    headers: ['parametro', 'valor', 'descripcion'],
    rows: [
      ['carrito_expira_min', '30', 'Minutos antes de vaciar carrito automáticamente'],
      ['max_productos_carrito', '20', 'Máximo de items diferentes en el carrito'],
      ['mostrar_imagenes', 'SI', 'Enviar imágenes de productos (SI/NO)'],
      ['usar_ia_busqueda', 'SI', 'Usar IA para búsqueda inteligente (SI/NO)'],
      ['idioma', 'es', 'Idioma del bot (es=español, en=inglés)'],
      ['zona_horaria', '-5', 'UTC offset (Colombia = -5)'],
      ['notificar_admin', 'SI', 'Notificar ventas al admin (SI/NO)'],
      ['admin_telefono', '573001234567', 'Teléfono del administrador'],
      ['cache_productos_min', '5', 'Minutos para actualizar caché de productos'],
      ['max_resultados_busqueda', '10', 'Máximo de productos en resultados de búsqueda']
    ]
  }
};

async function createGoogleSheet() {
  try {
    console.log('🚀 Iniciando creación de Google Sheet...\n');

    // Verificar que existan las credenciales
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './google-credentials.json';
    
    if (!fs.existsSync(credentialsPath)) {
      console.error('❌ Error: No se encontró el archivo de credenciales de Google');
      console.log('\n📋 Pasos para obtener las credenciales:');
      console.log('1. Ve a https://console.cloud.google.com');
      console.log('2. Crea un proyecto nuevo o selecciona uno existente');
      console.log('3. Habilita Google Sheets API');
      console.log('4. Ve a "Credentials" > "Create Credentials" > "Service Account"');
      console.log('5. Descarga el archivo JSON de credenciales');
      console.log('6. Guárdalo como "google-credentials.json" en la raíz del proyecto');
      console.log('7. O configura la variable GOOGLE_APPLICATION_CREDENTIALS\n');
      process.exit(1);
    }

    // Autenticar con Google
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file'
      ]
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    console.log('✅ Autenticación exitosa\n');

    // Crear el spreadsheet
    console.log('📊 Creando Google Sheet...');
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'Tienda WhatsApp Bot - Fashion Store'
        },
        sheets: Object.keys(SHEET_DATA).map((sheetName, index) => ({
          properties: {
            sheetId: index,
            title: sheetName,
            gridProperties: {
              rowCount: 100,
              columnCount: 10,
              frozenRowCount: 1
            },
            tabColor: SHEET_COLORS[sheetName]
          }
        }))
      }
    });

    const spreadsheetId = createResponse.data.spreadsheetId;
    console.log(`✅ Google Sheet creado: ${spreadsheetId}\n`);

    // Llenar cada hoja con datos
    console.log('📝 Llenando hojas con datos...\n');
    
    for (const [sheetName, data] of Object.entries(SHEET_DATA)) {
      console.log(`   Procesando hoja: ${sheetName}`);
      
      const values = [data.headers, ...data.rows];
      
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values }
      });

      // Formatear encabezados (negrita y fondo gris)
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            repeatCell: {
              range: {
                sheetId: Object.keys(SHEET_DATA).indexOf(sheetName),
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                  textFormat: { bold: true },
                  horizontalAlignment: 'CENTER'
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          }]
        }
      });
    }

    console.log('\n✅ Todas las hojas llenadas exitosamente\n');

    // Ajustar ancho de columnas
    console.log('🎨 Ajustando formato...');
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: Object.keys(SHEET_DATA).map((_, index) => ({
          autoResizeDimensions: {
            dimensions: {
              sheetId: index,
              dimension: 'COLUMNS',
              startIndex: 0,
              endIndex: 10
            }
          }
        }))
      }
    });

    console.log('✅ Formato aplicado\n');

    // Mostrar información final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ¡Google Sheet creado exitosamente!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 INFORMACIÓN IMPORTANTE:\n');
    console.log(`📊 Spreadsheet ID: ${spreadsheetId}`);
    console.log(`🔗 URL: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit\n`);
    console.log('📝 PRÓXIMOS PASOS:\n');
    console.log('1. Abre el Google Sheet en tu navegador');
    console.log('2. Revisa y personaliza los datos de ejemplo');
    console.log('3. Agrega el Spreadsheet ID a tu archivo .env:');
    console.log(`   GOOGLE_SHEETS_SPREADSHEET_ID=${spreadsheetId}\n`);
    console.log('4. Asegúrate de que el Service Account tenga acceso al Sheet');
    console.log('   (El script ya lo compartió automáticamente)\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Guardar el ID en un archivo para referencia
    fs.writeFileSync(
      path.join(__dirname, '../.spreadsheet-id'),
      spreadsheetId,
      'utf8'
    );
    console.log('💾 Spreadsheet ID guardado en .spreadsheet-id\n');

  } catch (error) {
    console.error('❌ Error al crear Google Sheet:', error.message);
    if (error.response) {
      console.error('Detalles:', error.response.data);
    }
    process.exit(1);
  }
}

// Ejecutar el script
createGoogleSheet();

// Made with Bob
