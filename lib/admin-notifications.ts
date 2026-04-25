/**
 * Sistema de notificaciones al administrador para confirmación de pagos
 */

import { getKapsoClient } from './kapso';
import { getStoreData } from './google-sheets';
import type { CartItem } from '@/types/store';
import type { PendingOrder } from './db';

/**
 * Envía notificación al administrador sobre un pedido pendiente
 * IMPORTANTE: Esta función intenta enviar un mensaje directo al admin.
 * Si falla por la ventana de 24h, el admin debe iniciar conversación primero.
 */
export async function notifyAdminNewOrder(
  orderId: string,
  customerPhone: string,
  customerName: string,
  items: CartItem[],
  total: number,
  paymentMethod: string,
  phoneNumberId: string
): Promise<void> {
  try {
    const storeData = await getStoreData();
    const { simbolo_moneda } = storeData.storeInfo;
    const { admin_telefono } = storeData.config;

    if (!admin_telefono) {
      console.warn('Admin phone not configured, skipping notification');
      return;
    }

    // Formatear lista de productos
    const itemsList = items.map((item, index) =>
      `${index + 1}. ${item.product_name} x${item.quantity} - ${simbolo_moneda}${(item.price * item.quantity).toLocaleString()}`
    ).join('\n');

    const message = `🔔 *NUEVO PEDIDO PENDIENTE*

📋 *ID:* ${orderId}
👤 *Cliente:* ${customerName}
📱 *Teléfono:* ${customerPhone}
💳 *Método de pago:* ${paymentMethod}

🛒 *Productos:*
${itemsList}

💰 *Total:* ${simbolo_moneda}${total.toLocaleString()}

⏰ Pedido recibido: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}

━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ *ACCIÓN REQUERIDA*

Para aprobar, responde:
✅ *SI ${orderId}*

Para rechazar, responde:
❌ *NO ${orderId}*

O usa los botones de abajo ↓`;

    // Botones interactivos para aprobar/rechazar
    // Nota: Los botones pueden no mostrarse en algunos dispositivos (iPhone)
    // Por eso también incluimos las instrucciones de texto
    // Botones con el ID COMPLETO para que coincida con el mensaje
    const buttons = [
      {
        id: `approve_${orderId}`,
        title: `SI ${orderId}`
      },
      {
        id: `reject_${orderId}`,
        title: `NO ${orderId}`
      }
    ];

    const kapsoClient = getKapsoClient();
    
    try {
      // Intentar enviar mensaje directo con botones
      await kapsoClient.sendMessage({
        to: admin_telefono,
        message: message,
        phoneNumberId: phoneNumberId,
        buttons: buttons,
      });
      console.log(`✅ Admin notification sent for order ${orderId} with interactive buttons`);
    } catch (error: any) {
      // Si falla por ventana de 24h, registrar el error pero no fallar
      if (error.response?.data?.error?.includes('24-hour')) {
        console.warn(`⚠️ Cannot notify admin (24h window). Order ${orderId} saved in database.`);
        console.warn(`Admin must check pending orders manually or initiate conversation first.`);
        // No lanzar error - el pedido ya está guardado en la BD
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error in admin notification system:', error);
    // No lanzar error - el pedido ya está guardado en la BD
  }
}

/**
 * Notifica al cliente sobre el estado de su pedido
 */
export async function notifyCustomerOrderStatus(
  customerPhone: string,
  customerName: string,
  orderId: string,
  status: 'APPROVED' | 'REJECTED',
  phoneNumberId: string,
  invoiceUrl?: string
): Promise<void> {
  try {
    const kapsoClient = getKapsoClient();
    
    let message: string;
    if (status === 'APPROVED') {
      message = `✅ *PEDIDO APROBADO*

Hola ${customerName},

Tu pedido *${orderId}* ha sido aprobado y está siendo procesado.

Pronto recibirás tu pedido. ¡Gracias por tu compra! 🎉`;

      // Si hay factura, agregarla al mensaje
      if (invoiceUrl) {
        message += `

📄 *FACTURA GENERADA*

Tu factura ha sido generada exitosamente.

📥 Descarga tu factura aquí:
${invoiceUrl}`;
      }
    } else {
      message = `❌ *PEDIDO RECHAZADO*

Hola ${customerName},

Lamentamos informarte que tu pedido *${orderId}* no pudo ser procesado.

Si tienes alguna duda, por favor contáctanos.`;
    }

    await kapsoClient.sendMessage({
      to: customerPhone,
      message: message,
      phoneNumberId: phoneNumberId,
    });

    console.log(`Customer notification sent for order ${orderId}: ${status}`);
  } catch (error) {
    console.error('Error sending customer notification:', error);
    throw error;
  }
}

/**
 * Detecta si un mensaje es una respuesta del admin (SI/NO + ID)
 */
export function parseAdminResponse(text: string): { action: 'APPROVE' | 'REJECT' | null; orderId: string | null } {
  const upperText = text.toUpperCase().trim();
  
  // Detectar SI ORD123456789
  const approveMatch = upperText.match(/^SI\s+(ORD\d+)$/);
  if (approveMatch) {
    return { action: 'APPROVE', orderId: approveMatch[1] };
  }
  
  // Detectar NO ORD123456789
  const rejectMatch = upperText.match(/^NO\s+(ORD\d+)$/);
  if (rejectMatch) {
    return { action: 'REJECT', orderId: rejectMatch[1] };
  }
  
  return { action: null, orderId: null };
}

/**
 * Verifica si un número de teléfono es el administrador
 */
export async function isAdminPhone(phoneNumber: string): Promise<boolean> {
  try {
    const storeData = await getStoreData();
    const { admin_telefono } = storeData.config;
    
    // Normalizar números (eliminar espacios, guiones, etc.)
    const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    const normalizedAdmin = admin_telefono?.replace(/[\s\-\(\)]/g, '') || '';
    
    return normalizedPhone === normalizedAdmin;
  } catch (error) {
    console.error('Error checking admin phone:', error);
    return false;
  }
}

// Made with Bob
