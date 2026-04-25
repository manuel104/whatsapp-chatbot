/**
 * Funciones auxiliares para el sistema de tienda
 */

import type { Product, CartItem, StoreData } from '@/types/store';
import { getStoreData, getProductById, searchProducts, getProductsByCategory } from './google-sheets';
import { getCart, addToCart, getCartTotal, clearCart } from './db';

/**
 * Formatea un producto para mostrar en WhatsApp
 */
export function formatProduct(product: Product, storeData: StoreData): string {
  const { simbolo_moneda } = storeData.storeInfo;
  const stockText = product.stock > 0 ? `✅ Stock: ${product.stock}` : '❌ Sin stock';
  
  return `*${product.nombre}*
${product.descripcion}
💰 Precio: ${simbolo_moneda}${product.precio.toLocaleString()}
${stockText}
🆔 Código: ${product.id}`;
}

/**
 * Formatea una lista de productos
 */
export function formatProductList(products: Product[], storeData: StoreData): string {
  if (products.length === 0) {
    return storeData.messages.producto_no_encontrado;
  }

  const { simbolo_moneda } = storeData.storeInfo;
  
  return products.map((p, index) => 
    `${index + 1}. *${p.nombre}*
   ${simbolo_moneda}${p.precio.toLocaleString()} | Stock: ${p.stock}
   🆔 ${p.id}`
  ).join('\n\n');
}

/**
 * Formatea el carrito para mostrar
 */
export function formatCart(items: CartItem[], storeData: StoreData): string {
  if (items.length === 0) {
    return storeData.messages.carrito_vacio;
  }

  const { simbolo_moneda } = storeData.storeInfo;
  
  const itemsList = items.map((item, index) => 
    `${index + 1}. ${item.product_name} x${item.quantity}
   ${simbolo_moneda}${item.price.toLocaleString()} c/u = ${simbolo_moneda}${(item.price * item.quantity).toLocaleString()}`
  ).join('\n\n');

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal >= storeData.storeInfo.envio_gratis_min ? 0 : 5000; // Ejemplo: $5000 envío
  const total = subtotal + shipping;

  return `🛒 *Tu Carrito*

${itemsList}

━━━━━━━━━━━━━━━━
Subtotal: ${simbolo_moneda}${subtotal.toLocaleString()}
Envío: ${shipping === 0 ? 'GRATIS ✨' : simbolo_moneda + shipping.toLocaleString()}
━━━━━━━━━━━━━━━━
*Total: ${simbolo_moneda}${total.toLocaleString()}*`;
}

/**
 * Genera el menú principal con categorías (SIN saludo)
 */
export function generateMainMenu(storeData: StoreData, contactName?: string, includeGreeting: boolean = false): string {
  const { nombre_tienda, horario } = storeData.storeInfo;
  const { menu_principal } = storeData.messages;
  
  const categoriesText = storeData.categories
    .map(cat => `${cat.emoji} ${cat.nombre}`)
    .join('\n');

  // Si includeGreeting es true, agregar saludo personalizado
  let greeting = '';
  if (includeGreeting) {
    if (contactName) {
      greeting = `¡Hola ${contactName}! 👋 Bienvenido a nuestra tienda.\n\n`;
    } else {
      greeting = `¡Hola! 👋 Bienvenido a nuestra tienda.\n\n`;
    }
  }

  return `${greeting}🏪 *${nombre_tienda}*
🕐 ${horario}

${menu_principal}

${categoriesText}

🔍 Buscar productos
🛒 Ver carrito
❓ Ayuda`;
}

/**
 * Procesa un comando de agregar al carrito
 * Formato: "agregar P001" o "agregar P001 x2"
 */
export async function processAddToCart(
  text: string,
  conversationId: string,
  phoneNumber: string
): Promise<{ success: boolean; message: string; product?: Product }> {
  try {
    // Extraer ID del producto y cantidad
    const match = text.match(/agregar\s+([A-Z0-9]+)(?:\s+x?(\d+))?/i);
    if (!match) {
      return {
        success: false,
        message: 'Formato incorrecto. Usa: "agregar P001" o "agregar P001 x2"'
      };
    }

    const productId = match[1].toUpperCase();
    const quantity = parseInt(match[2] || '1');

    if (quantity <= 0 || quantity > 20) {
      return {
        success: false,
        message: 'La cantidad debe ser entre 1 y 20'
      };
    }

    // Obtener producto
    const product = await getProductById(productId);
    if (!product) {
      return {
        success: false,
        message: `No encontré el producto ${productId}`
      };
    }

    // Verificar stock
    if (product.stock < quantity) {
      return {
        success: false,
        message: `Solo hay ${product.stock} unidades disponibles de ${product.nombre}`
      };
    }

    // Agregar al carrito
    const cartItem: CartItem = {
      product_id: product.id,
      product_name: product.nombre,
      quantity: quantity,
      price: product.precio
    };

    await addToCart(conversationId, phoneNumber, cartItem);

    const storeData = await getStoreData();
    return {
      success: true,
      message: `✅ ${quantity}x ${product.nombre} agregado al carrito`,
      product
    };
  } catch (error) {
    console.error('Error processing add to cart:', error);
    return {
      success: false,
      message: 'Error al agregar al carrito. Intenta de nuevo.'
    };
  }
}

/**
 * Detecta la intención del usuario usando palabras clave
 */
export function detectIntent(text: string): {
  intent: 'menu' | 'search' | 'category' | 'add_to_cart' | 'view_cart' | 'checkout' | 'help' | 'unknown';
  data?: any;
} {
  const lowerText = text.toLowerCase().trim();

  // Menú principal
  if (lowerText.match(/^(menu|menú|inicio|hola|hi|hey)$/)) {
    return { intent: 'menu' };
  }

  // Buscar productos
  if (lowerText.match(/^(buscar|busco|quiero|necesito|buscando)/)) {
    const query = lowerText.replace(/^(buscar|busco|quiero|necesito|buscando)\s+/, '');
    return { intent: 'search', data: { query } };
  }

  // Agregar al carrito
  if (lowerText.match(/^(agregar|añadir|add|comprar)/)) {
    return { intent: 'add_to_cart', data: { text } };
  }

  // Ver carrito
  if (lowerText.match(/^(carrito|cart|ver carrito|mi carrito)/)) {
    return { intent: 'view_cart' };
  }

  // Finalizar compra
  if (lowerText.match(/^(comprar|pagar|finalizar|checkout|confirmar)/)) {
    return { intent: 'checkout' };
  }

  // Ayuda
  if (lowerText.match(/^(ayuda|help|como|cómo)/)) {
    return { intent: 'help' };
  }

  // Categoría (detectar por nombre de categoría)
  // Esto se puede mejorar cargando las categorías dinámicamente
  const categoryKeywords = ['tecnología', 'tecnologia', 'ropa', 'hogar', 'deportes', 'juguetes'];
  for (const keyword of categoryKeywords) {
    if (lowerText.includes(keyword)) {
      return { intent: 'category', data: { category: keyword } };
    }
  }

  return { intent: 'unknown' };
}

/**
 * Genera botones para el menú principal
 */
export function getMainMenuButtons(storeData: StoreData) {
  return storeData.buttons
    .filter(btn => ['ver_productos', 'ver_carrito', 'ayuda'].includes(btn.id_boton))
    .map(btn => ({
      id: btn.id_boton,
      title: `${btn.emoji} ${btn.texto}`.substring(0, 20) // WhatsApp limit
    }));
}

/**
 * Genera botones para categorías
 */
export function getCategoryButtons(storeData: StoreData) {
  return storeData.categories.slice(0, 3).map(cat => ({
    id: `cat_${cat.nombre.toLowerCase()}`,
    title: `${cat.emoji} ${cat.nombre}`.substring(0, 20)
  }));
}

/**
 * Genera botones para el carrito
 */
export function getCartButtons() {
  return [
    { id: 'finalizar_compra', title: '✅ Finalizar' },
    { id: 'seguir_comprando', title: '🛍️ Seguir' },
    { id: 'vaciar_carrito', title: '🗑️ Vaciar' }
  ];
}

/**
 * Genera botones para métodos de pago
 */
export function getPaymentButtons(storeData: StoreData) {
  return storeData.paymentMethods.map(method => ({
    id: `pago_${method.id}`,
    title: `${method.emoji} ${method.nombre}`.substring(0, 20)
  }));
}

// Made with Bob
