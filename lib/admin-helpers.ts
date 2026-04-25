/**
 * Funciones auxiliares para el administrador
 * Manejo de pedidos pendientes y comandos admin
 */

import { getPendingOrders } from './db';
import { getStoreData } from './google-sheets';
import { getKapsoClient } from './kapso';

/**
 * Envía lista de pedidos pendientes al admin con botones para cada pedido
 */
export async function sendPendingOrdersList(
  adminPhone: string,
  phoneNumberId: string
): Promise<void> {
  try {
    const pendingOrders = await getPendingOrders();
    const storeData = await getStoreData();
    const { simbolo_moneda } = storeData.storeInfo;

    if (pendingOrders.length === 0) {
      const message = `📋 *PEDIDOS PENDIENTES*

No hay pedidos pendientes en este momento. ✅`;

      const kapsoClient = getKapsoClient();
      await kapsoClient.sendMessage({
        to: adminPhone,
        message: message,
        phoneNumberId: phoneNumberId,
      });
      return;
    }

    const kapsoClient = getKapsoClient();

    // Enviar cada pedido con sus propios botones
    for (const order of pendingOrders) {
      const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
      
      // Detalles de productos
      const itemsList = order.items.map(item =>
        `• ${item.product_name} x${item.quantity} - ${simbolo_moneda}${(item.price * item.quantity).toLocaleString()}`
      ).join('\n');
      
      const message = `🔔 *PEDIDO PENDIENTE*

📋 ID: *${order.id}*
👤 Cliente: ${order.contact_name}
📱 Teléfono: ${order.phone_number}
💳 Método de pago: ${order.payment_method}

🛒 *Productos:*
${itemsList}

💰 *Total: ${simbolo_moneda}${order.total.toLocaleString()}*

⏰ Pedido recibido: ${new Date(order.created_at).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}

━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ *ACCIÓN REQUERIDA*

Para aprobar, responde:
✅ *SI ${order.id}*

Para rechazar, responde:
❌ *NO ${order.id}*

O usa los botones de abajo ↓`;

      // Crear botones para este pedido específico
      const shortOrderId = order.id.substring(0, 10);
      const buttons = [
        {
          id: `approve_${order.id}`,
          title: `✅ ${shortOrderId}`
        },
        {
          id: `reject_${order.id}`,
          title: `❌ ${shortOrderId}`
        }
      ];

      // Enviar mensaje con botones
      await kapsoClient.sendMessage({
        to: adminPhone,
        message: message,
        phoneNumberId: phoneNumberId,
        buttons: buttons,
      });
    }

    console.log(`Pending orders list sent to admin: ${pendingOrders.length} orders`);
  } catch (error) {
    console.error('Error sending pending orders list:', error);
    throw error;
  }
}

/**
 * Detecta comandos del admin
 */
export function parseAdminCommand(text: string): {
  command: 'LIST_PENDING' | 'HELP' | null;
} {
  const upperText = text.toUpperCase().trim();

  // Comandos para listar pedidos pendientes
  if (
    upperText === 'PEDIDOS' ||
    upperText === 'PENDIENTES' ||
    upperText === 'LISTA' ||
    upperText === 'VER PEDIDOS'
  ) {
    return { command: 'LIST_PENDING' };
  }

  // Comando de ayuda
  if (upperText === 'AYUDA' || upperText === 'HELP' || upperText === 'COMANDOS') {
    return { command: 'HELP' };
  }

  return { command: null };
}

/**
 * Envía mensaje de ayuda al admin
 */
export async function sendAdminHelp(
  adminPhone: string,
  phoneNumberId: string
): Promise<void> {
  const message = `🤖 *COMANDOS DE ADMINISTRADOR*

📋 *Gestión de Pedidos:*
• PEDIDOS - Ver pedidos pendientes
• SI ORD123 - Aprobar pedido
• NO ORD123 - Rechazar pedido

ℹ️ *Información:*
• AYUDA - Ver este mensaje

━━━━━━━━━━━━━━━━━━━━━━━━━━
Los pedidos se guardan automáticamente en la base de datos. Puedes aprobarlos o rechazarlos en cualquier momento.`;

  const kapsoClient = getKapsoClient();
  await kapsoClient.sendMessage({
    to: adminPhone,
    message: message,
    phoneNumberId: phoneNumberId,
  });
}

/**
 * Genera menú principal para el administrador
 */
export async function generateAdminMenu(adminName?: string): Promise<string> {
  const greeting = adminName ? `Hola ${adminName}` : 'Hola Administrador';
  
  const menu = `👨‍💼 *${greeting}*

Bienvenido al panel de administración.

📋 *COMANDOS DISPONIBLES:*

🔹 *PEDIDOS* - Ver pedidos pendientes
🔹 *SI ORD123* - Aprobar pedido
🔹 *NO ORD123* - Rechazar pedido
🔹 *AYUDA* - Ver esta ayuda

━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 *Tip:* Escribe "PEDIDOS" para ver la lista de pedidos pendientes de aprobación.

⚠️ *Importante:* Para recibir notificaciones automáticas de nuevos pedidos, envía un mensaje al bot cada mañana. Esto abre la ventana de 24 horas de WhatsApp.`;

  return menu;
}

/**
 * Obtiene botones del menú admin
 */
export function getAdminMenuButtons(): Array<{ id: string; title: string }> {
  return [
    { id: 'admin_pedidos', title: '📋 Ver Pedidos' },
    { id: 'admin_ayuda', title: '❓ Ayuda' },
  ];
}

// Made with Bob