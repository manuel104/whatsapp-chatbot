/**
 * Tipos TypeScript para el sistema de tienda
 */

// Producto
export interface Product {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
  descripcion: string;
  imagen_url?: string;
  activo: 'SI' | 'NO';
}

// Categoría
export interface Category {
  nombre: string;
  descripcion: string;
  emoji: string;
}

// Información de la tienda
export interface StoreInfo {
  nombre_tienda: string;
  horario: string;
  direccion: string;
  telefono: string;
  email: string;
  envio_gratis_min: number;
  metodos_pago: string;
  tiempo_entrega: string;
  moneda: string;
  simbolo_moneda: string;
}

// Mensajes del bot
export interface BotMessages {
  bienvenida: string;
  menu_principal: string;
  producto_agregado: string;
  carrito_vacio: string;
  pedido_confirmado: string;
  sin_stock: string;
  error_general: string;
  despedida: string;
  selecciona_categoria: string;
  escribe_busqueda: string;
  producto_no_encontrado: string;
  confirmacion_compra: string;
  selecciona_pago: string;
  gracias_compra: string;
}

// Botones
export interface BotButton {
  id_boton: string;
  texto: string;
  emoji: string;
}

// Método de pago
export interface PaymentMethod {
  id: string;
  nombre: string;
  emoji: string;
  instrucciones: string;
}

// Configuración
export interface StoreConfig {
  carrito_expira_min: number;
  max_productos_carrito: number;
  mostrar_imagenes: 'SI' | 'NO';
  usar_ia_busqueda: 'SI' | 'NO';
  idioma: string;
  zona_horaria: number;
  notificar_admin: 'SI' | 'NO';
  admin_telefono: string;
  cache_productos_min: number;
  max_resultados_busqueda: number;
}

// Venta
export interface Sale {
  id_venta: string;
  fecha: string;
  cliente_tel: string;
  cliente_nombre: string;
  productos: string; // Formato: "P001x2,P003x1"
  total: number;
  estado: 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA';
  factura_url?: string;
}

// Item del carrito
export interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

// Carrito completo
export interface Cart {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

// Datos completos de la tienda (caché)
export interface StoreData {
  products: Product[];
  categories: Category[];
  storeInfo: StoreInfo;
  messages: BotMessages;
  buttons: BotButton[];
  paymentMethods: PaymentMethod[];
  config: StoreConfig;
  lastUpdated: Date;
}

// Made with Bob
