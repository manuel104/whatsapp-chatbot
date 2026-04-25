/**
 * Librería para integración con Google Sheets
 * Maneja la lectura de datos de la tienda desde Google Sheets
 */

import { google } from 'googleapis';
import type {
  Product,
  Category,
  StoreInfo,
  BotMessages,
  BotButton,
  PaymentMethod,
  StoreConfig,
  Sale,
  StoreData,
} from '@/types/store';

// Configuración
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos por defecto

// Caché en memoria
let cachedStoreData: StoreData | null = null;
let lastCacheUpdate: Date | null = null;

/**
 * Obtiene el cliente autenticado de Google Sheets
 */
function getGoogleSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Lee datos de una hoja específica
 */
async function readSheet(sheetName: string, range: string): Promise<any[][]> {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!${range}`,
    });

    return response.data.values || [];
  } catch (error) {
    console.error(`Error reading sheet ${sheetName}:`, error);
    throw error;
  }
}

/**
 * Convierte filas de Google Sheets a objetos Product
 */
function parseProducts(rows: any[][]): Product[] {
  // Saltar la fila de encabezados
  return rows.slice(1).map(row => ({
    id: row[0] || '',
    nombre: row[1] || '',
    precio: parseFloat(row[2]) || 0,
    stock: parseInt(row[3]) || 0,
    categoria: row[4] || '',
    descripcion: row[5] || '',
    imagen_url: row[6] || undefined,
    activo: (row[7] || 'SI') as 'SI' | 'NO',
  })).filter(p => p.id && p.activo === 'SI'); // Solo productos activos
}

/**
 * Convierte filas de Google Sheets a objetos Category
 */
function parseCategories(rows: any[][]): Category[] {
  return rows.slice(1).map(row => ({
    nombre: row[0] || '',
    descripcion: row[1] || '',
    emoji: row[2] || '📦',
  })).filter(c => c.nombre);
}

/**
 * Convierte filas de Google Sheets a objeto StoreInfo
 */
function parseStoreInfo(rows: any[][]): StoreInfo {
  const data: Record<string, string> = {};
  rows.slice(1).forEach(row => {
    if (row[0]) {
      data[row[0]] = row[1] || '';
    }
  });

  return {
    nombre_tienda: data.nombre_tienda || 'Mi Tienda',
    horario: data.horario || 'Lun-Vie 9am-6pm',
    direccion: data.direccion || '',
    telefono: data.telefono || '',
    email: data.email || '',
    envio_gratis_min: parseFloat(data.envio_gratis_min) || 0,
    metodos_pago: data.metodos_pago || 'Efectivo',
    tiempo_entrega: data.tiempo_entrega || '24-48 horas',
    moneda: data.moneda || 'COP',
    simbolo_moneda: data.simbolo_moneda || '$',
  };
}

/**
 * Convierte filas de Google Sheets a objeto BotMessages
 */
function parseBotMessages(rows: any[][]): BotMessages {
  const data: Record<string, string> = {};
  rows.slice(1).forEach(row => {
    if (row[0]) {
      data[row[0]] = row[1] || '';
    }
  });

  return {
    bienvenida: data.bienvenida || '¡Hola! Bienvenido a nuestra tienda',
    menu_principal: data.menu_principal || 'Selecciona una opción:',
    producto_agregado: data.producto_agregado || 'Producto agregado al carrito',
    carrito_vacio: data.carrito_vacio || 'Tu carrito está vacío',
    pedido_confirmado: data.pedido_confirmado || 'Pedido confirmado',
    sin_stock: data.sin_stock || 'Producto sin stock',
    error_general: data.error_general || 'Ocurrió un error',
    despedida: data.despedida || '¡Gracias por tu compra!',
    selecciona_categoria: data.selecciona_categoria || 'Selecciona una categoría:',
    escribe_busqueda: data.escribe_busqueda || 'Escribe lo que buscas:',
    producto_no_encontrado: data.producto_no_encontrado || 'No encontramos ese producto',
    confirmacion_compra: data.confirmacion_compra || '¿Confirmas tu compra?',
    selecciona_pago: data.selecciona_pago || 'Selecciona método de pago:',
    gracias_compra: data.gracias_compra || '¡Gracias por tu compra!',
  };
}

/**
 * Convierte filas de Google Sheets a objetos BotButton
 */
function parseBotButtons(rows: any[][]): BotButton[] {
  return rows.slice(1).map(row => ({
    id_boton: row[0] || '',
    texto: row[1] || '',
    emoji: row[2] || '',
  })).filter(b => b.id_boton);
}

/**
 * Convierte filas de Google Sheets a objetos PaymentMethod
 */
function parsePaymentMethods(rows: any[][]): PaymentMethod[] {
  return rows.slice(1).map(row => ({
    id: row[0] || '',
    nombre: row[1] || '',
    emoji: row[2] || '💳',
    instrucciones: row[3] || '',
  })).filter(p => p.id);
}

/**
 * Convierte filas de Google Sheets a objeto StoreConfig
 */
function parseStoreConfig(rows: any[][]): StoreConfig {
  const data: Record<string, string> = {};
  rows.slice(1).forEach(row => {
    if (row[0]) {
      data[row[0]] = row[1] || '';
    }
  });

  return {
    carrito_expira_min: parseInt(data.carrito_expira_min) || 30,
    max_productos_carrito: parseInt(data.max_productos_carrito) || 20,
    mostrar_imagenes: (data.mostrar_imagenes || 'SI') as 'SI' | 'NO',
    usar_ia_busqueda: (data.usar_ia_busqueda || 'SI') as 'SI' | 'NO',
    idioma: data.idioma || 'es',
    zona_horaria: parseInt(data.zona_horaria) || -5,
    notificar_admin: (data.notificar_admin || 'NO') as 'SI' | 'NO',
    admin_telefono: data.admin_telefono || '',
    cache_productos_min: parseInt(data.cache_productos_min) || 5,
    max_resultados_busqueda: parseInt(data.max_resultados_busqueda) || 10,
  };
}

/**
 * Obtiene todos los datos de la tienda desde Google Sheets
 * Usa caché para evitar llamadas excesivas a la API
 */
export async function getStoreData(forceRefresh = false): Promise<StoreData> {
  // Verificar si hay caché válido
  if (!forceRefresh && cachedStoreData && lastCacheUpdate) {
    const cacheAge = Date.now() - lastCacheUpdate.getTime();
    if (cacheAge < CACHE_DURATION_MS) {
      console.log('Returning cached store data');
      return cachedStoreData;
    }
  }

  console.log('Fetching fresh store data from Google Sheets');

  try {
    // Leer todas las hojas en paralelo
    const [
      productsRows,
      categoriesRows,
      storeInfoRows,
      messagesRows,
      buttonsRows,
      paymentMethodsRows,
      configRows,
    ] = await Promise.all([
      readSheet('PRODUCTOS', 'A1:H100'),
      readSheet('CATEGORIAS', 'A1:C20'),
      readSheet('INFO_TIENDA', 'A1:B20'),
      readSheet('MENSAJES', 'A1:B20'),
      readSheet('BOTONES', 'A1:C20'),
      readSheet('METODOS_PAGO', 'A1:D10'),
      readSheet('CONFIGURACION', 'A1:B20'),
    ]);

    // Parsear los datos
    const storeData: StoreData = {
      products: parseProducts(productsRows),
      categories: parseCategories(categoriesRows),
      storeInfo: parseStoreInfo(storeInfoRows),
      messages: parseBotMessages(messagesRows),
      buttons: parseBotButtons(buttonsRows),
      paymentMethods: parsePaymentMethods(paymentMethodsRows),
      config: parseStoreConfig(configRows),
      lastUpdated: new Date(),
    };

    // Actualizar caché
    cachedStoreData = storeData;
    lastCacheUpdate = new Date();

    console.log(`Store data loaded: ${storeData.products.length} products, ${storeData.categories.length} categories`);

    return storeData;
  } catch (error) {
    console.error('Error fetching store data:', error);
    
    // Si hay caché antiguo, devolverlo como fallback
    if (cachedStoreData) {
      console.log('Returning stale cache due to error');
      return cachedStoreData;
    }
    
    throw error;
  }
}

/**
 * Obtiene solo los productos
 */
export async function getProducts(): Promise<Product[]> {
  const storeData = await getStoreData();
  return storeData.products;
}

/**
 * Obtiene un producto por ID
 */
export async function getProductById(productId: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find(p => p.id === productId) || null;
}

/**
 * Busca productos por categoría
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const products = await getProducts();
  return products.filter(p => p.categoria.toLowerCase() === category.toLowerCase());
}

/**
 * Busca productos por texto (nombre o descripción)
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const products = await getProducts();
  const lowerQuery = query.toLowerCase();
  
  return products.filter(p => 
    p.nombre.toLowerCase().includes(lowerQuery) ||
    p.descripcion.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Obtiene las categorías disponibles
 */
export async function getCategories(): Promise<Category[]> {
  const storeData = await getStoreData();
  return storeData.categories;
}

/**
 * Registra una venta en Google Sheets
 */
export async function recordSale(sale: Omit<Sale, 'id_venta'>): Promise<string> {
  try {
    const sheets = getGoogleSheetsClient();
    
    // Generar ID de venta
    const saleId = `V${Date.now()}`;
    
    // Preparar fila
    const row = [
      saleId,
      sale.fecha,
      sale.cliente_tel,
      sale.cliente_nombre,
      sale.productos,
      sale.total,
      sale.estado,
      sale.factura_url || '',
    ];

    // Agregar fila
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'VENTAS!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    console.log(`Sale recorded: ${saleId}`);
    return saleId;
  } catch (error) {
    console.error('Error recording sale:', error);
    throw error;
  }
}

/**
 * Limpia el caché manualmente
 */
export function clearCache(): void {
  cachedStoreData = null;
  lastCacheUpdate = null;
  console.log('Store data cache cleared');
}

// Made with Bob
