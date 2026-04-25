/**
 * Script para llenar un Google Sheet existente con datos de ejemplo
 * 
 * USO:
 * node scripts/fill-google-sheet.js
 */

const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

// Datos de ejemplo para cada hoja (mismo contenido que create-google-sheet.js)
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
    rows: []
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

async function fillGoogleSheet() {
  try {
    console.log('🚀 Iniciando llenado de Google Sheet...\n');

    // Verificar que exista el SPREADSHEET_ID
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    if (!spreadsheetId) {
      console.error('❌ Error: GOOGLE_SHEETS_SPREADSHEET_ID no está configurado en .env.local');
      process.exit(1);
    }

    console.log(`📊 Spreadsheet ID: ${spreadsheetId}\n`);

    // Autenticar con Google
    const auth = new google.auth.GoogleAuth({
      keyFile: './google-credentials.json',
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ]
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    console.log('✅ Autenticación exitosa\n');

    // Llenar cada hoja con datos
    console.log('📝 Llenando hojas con datos...\n');
    
    for (const [sheetName, data] of Object.entries(SHEET_DATA)) {
      console.log(`   Procesando hoja: ${sheetName}`);
      
      const values = [data.headers, ...data.rows];
      
      try {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1`,
          valueInputOption: 'RAW',
          requestBody: { values }
        });
        console.log(`   ✅ ${sheetName} completada`);
      } catch (error) {
        console.log(`   ⚠️  ${sheetName} - Error: ${error.message}`);
        console.log(`   💡 Asegúrate de que la hoja "${sheetName}" exista en el Sheet`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ¡Google Sheet llenado exitosamente!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`🔗 URL: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit\n`);
    console.log('📋 PRÓXIMOS PASOS:\n');
    console.log('1. Abre el Google Sheet y verifica los datos');
    console.log('2. Personaliza la información de tu tienda (hoja INFO_TIENDA)');
    console.log('3. Agrega tus productos reales (hoja PRODUCTOS)');
    console.log('4. Ajusta los mensajes según tu marca (hoja MENSAJES)\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error al llenar Google Sheet:', error.message);
    if (error.response) {
      console.error('Detalles:', error.response.data);
    }
    process.exit(1);
  }
}

// Ejecutar el script
fillGoogleSheet();

// Made with Bob
