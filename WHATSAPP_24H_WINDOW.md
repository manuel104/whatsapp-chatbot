# Ventana de 24 Horas de WhatsApp Business API

## 🚨 Problema: Error "Cannot send non-template messages outside the 24-hour window"

Este es un error común de WhatsApp Business API que ocurre cuando intentas enviar mensajes a un usuario que no ha interactuado contigo en las últimas 24 horas.

## 📋 ¿Qué es la Ventana de 24 Horas?

WhatsApp Business API tiene una **restricción de ventana de 24 horas**:

- ✅ **Dentro de 24h**: Puedes enviar mensajes de texto normales libremente
- ❌ **Fuera de 24h**: Solo puedes enviar **template messages** (mensajes pre-aprobados)

### Ejemplo:
```
Cliente escribe: "Hola" → 10:00 AM Lunes
Bot puede responder libremente hasta: 10:00 AM Martes
Después de eso: Solo template messages
```

## 🔧 Soluciones Implementadas

### 1. **Manejo Graceful de Errores** ✅

El sistema ahora maneja el error de ventana de 24h sin fallar:

```typescript
// En lib/admin-notifications.ts
try {
  await kapsoClient.sendMessage({
    to: admin_telefono,
    message: message,
    phoneNumberId: phoneNumberId,
  });
  console.log(`✅ Admin notification sent`);
} catch (error: any) {
  if (error.response?.data?.error?.includes('24-hour')) {
    console.warn(`⚠️ Cannot notify admin (24h window)`);
    // No lanzar error - el pedido ya está guardado
  }
}
```

**Ventaja**: El pedido se guarda en la base de datos aunque no se pueda notificar al admin.

### 2. **Sistema de Comandos para Admin** 🤖

El admin puede consultar pedidos pendientes en cualquier momento:

#### Comandos Disponibles:

| Comando | Descripción |
|---------|-------------|
| `PEDIDOS` | Ver lista de pedidos pendientes |
| `PENDIENTES` | Ver lista de pedidos pendientes |
| `LISTA` | Ver lista de pedidos pendientes |
| `SI ORD123` | Aprobar pedido específico |
| `NO ORD123` | Rechazar pedido específico |
| `AYUDA` | Ver lista de comandos |

#### Ejemplo de Uso:

```
Admin escribe: "PEDIDOS"

Bot responde:
📋 PEDIDOS PENDIENTES (2)

1. ORD1735095161000
   Cliente: Manuel Orrego
   Tel: 573205293532
   Items: 3 productos
   Total: $150,000
   Método: Nequi
   Fecha: 24/04/2026 20:15:00

2. ORD1735095162000
   Cliente: Juan Pérez
   Tel: 573001234567
   Items: 1 productos
   Total: $50,000
   Método: Efectivo
   Fecha: 24/04/2026 20:20:00

━━━━━━━━━━━━━━━━━━━━━━━━━━
Para aprobar un pedido:
✅ SI ORD1735095161000

Para rechazar un pedido:
❌ NO ORD1735095161000
```

### 3. **Inicio de Conversación por el Admin** 💬

**Solución más simple**: El admin inicia la conversación con el bot.

#### Pasos:

1. **Admin envía cualquier mensaje al bot**
   - Ejemplo: "Hola", "Buenos días", "PEDIDOS"
   
2. **Se abre la ventana de 24h**
   - Ahora el bot puede enviar notificaciones al admin
   
3. **Admin recibe notificaciones automáticas**
   - Cuando lleguen nuevos pedidos en las próximas 24h

#### Recomendación:
```
El admin debe enviar un mensaje al bot cada mañana:
- "Buenos días"
- "PEDIDOS"
- Cualquier texto

Esto garantiza que recibirá notificaciones durante todo el día.
```

## 🎯 Flujo Recomendado

### Opción A: Admin Proactivo (Recomendado)

```
1. Admin inicia conversación cada mañana
   ↓
2. Ventana de 24h se abre
   ↓
3. Cliente hace pedido
   ↓
4. Bot notifica al admin automáticamente ✅
   ↓
5. Admin aprueba: "SI ORD123"
   ↓
6. Cliente recibe confirmación + factura
```

### Opción B: Admin Reactivo

```
1. Cliente hace pedido
   ↓
2. Pedido se guarda en base de datos ✅
   ↓
3. Bot intenta notificar admin (puede fallar si >24h)
   ↓
4. Admin consulta: "PEDIDOS"
   ↓
5. Admin ve lista de pendientes
   ↓
6. Admin aprueba: "SI ORD123"
   ↓
7. Cliente recibe confirmación + factura
```

## 📊 Comparación de Soluciones

| Solución | Ventajas | Desventajas | Costo |
|----------|----------|-------------|-------|
| **Template Messages** | Funciona siempre | Requiere aprobación de Meta, proceso lento | Gratis |
| **Admin Proactivo** | Simple, inmediato | Admin debe recordar iniciar conversación | Gratis |
| **Comandos Admin** | Flexible, sin restricciones | Admin debe consultar manualmente | Gratis |
| **Notificaciones Email** | Siempre funciona | Requiere configuración adicional | Gratis |
| **Notificaciones SMS** | Siempre funciona | Costo por SMS | $$ |

## 🔐 Template Messages (Solución Avanzada)

Si necesitas notificaciones automáticas 24/7, debes crear template messages:

### Pasos para Crear Template:

1. **Ir a Meta Business Manager**
   - https://business.facebook.com/

2. **Crear Template Message**
   - Nombre: `nuevo_pedido_admin`
   - Categoría: `UTILITY`
   - Idioma: `es`

3. **Contenido del Template**:
   ```
   🔔 Nuevo pedido pendiente

   ID: {{1}}
   Cliente: {{2}}
   Total: {{3}}

   Responde SI {{1}} para aprobar
   ```

4. **Enviar para Aprobación**
   - Meta revisa en 24-48 horas

5. **Usar en el Código**:
   ```typescript
   await kapsoClient.sendMessage({
     to: admin_telefono,
     type: 'template',
     templateName: 'nuevo_pedido_admin',
     templateLanguage: 'es',
     templateComponents: [
       {
         type: 'body',
         parameters: [
           { type: 'text', text: orderId },
           { type: 'text', text: customerName },
           { type: 'text', text: `$${total}` }
         ]
       }
     ],
     phoneNumberId: phoneNumberId,
   });
   ```

## ✅ Implementación Actual

El sistema ya está configurado para:

1. ✅ **Intentar notificar al admin** (funciona si está dentro de 24h)
2. ✅ **Guardar pedido en BD** (siempre funciona)
3. ✅ **Permitir consulta manual** (comando PEDIDOS)
4. ✅ **Procesar aprobaciones** (comando SI/NO)
5. ✅ **Generar facturas automáticas** (al aprobar)

## 📱 Instrucciones para el Admin

### Inicio del Día:
```
1. Abre WhatsApp
2. Envía "Buenos días" o "PEDIDOS" al bot
3. Listo - recibirás notificaciones durante 24h
```

### Durante el Día:
```
- Recibirás notificaciones automáticas de nuevos pedidos
- Responde "SI ORD123" para aprobar
- Responde "NO ORD123" para rechazar
```

### Si No Recibiste Notificación:
```
1. Escribe "PEDIDOS"
2. Verás lista de pendientes
3. Aprueba o rechaza según necesites
```

## 🐛 Troubleshooting

### Error: "Cannot send non-template messages"
**Solución**: Admin debe enviar un mensaje al bot primero.

### No Recibo Notificaciones
**Solución**: Verifica que el número del admin esté correcto en Google Sheets (pestaña CONFIGURACION).

### Pedido No Aparece en Lista
**Solución**: Verifica que el pedido se haya guardado en la base de datos (revisa logs).

## 📚 Referencias

- [WhatsApp Business API - Messaging Windows](https://developers.facebook.com/docs/whatsapp/pricing#conversations)
- [Template Messages Guide](https://developers.facebook.com/docs/whatsapp/message-templates)
- [Kapso API Documentation](https://docs.kapso.ai)

---

**Recomendación Final**: Para la mayoría de casos, la solución más simple y efectiva es que el admin inicie conversación cada mañana. Esto garantiza notificaciones automáticas durante todo el día sin costos adicionales ni configuraciones complejas.