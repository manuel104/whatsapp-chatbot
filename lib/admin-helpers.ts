/**
 * Funciones auxiliares para el administrador
 * Manejo de pedidos pendientes y comandos admin
 */

import { getPendingOrders } from './db';
import { getStoreData } from './google-sheets';
import { getKapsoClient } from './kapso';

/**
 * Envía lista de pedidos pendientes al admin
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

    // Formatear lista de pedidos
    const ordersList = pendingOrders.map((order, index) => {
      const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
      return `${index + 1}. *${order.id}*
   Cliente: ${order.contact_name}
   Tel: ${order.phone_number}
   Items: ${itemsCount} productos
   Total: ${simbolo_moneda}${order.total.toLocaleString()}
   Método: ${order.payment_method}
   Fecha: ${new Date(order.created_at).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`;
    }).join('\n\n');

    const message = `📋 *PEDIDOS PENDIENTES* (${pendingOrders.length})

${ordersList}

━━━━━━━━━━━━━━━━━━━━━━━━━━
Para aprobar un pedido:
✅ *SI ${pendingOrders[0].id}*

Para rechazar un pedido:
❌ *NO ${pendingOrders[0].id}*`;

    const kapsoClient = getKapsoClient();
    await kapsoClient.sendMessage({
      to: adminPhone,
      message: message,
      phoneNumberId: phoneNumberId,
    });

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