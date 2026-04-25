# 🛍️ Guía de Uso del Sistema de Tienda WhatsApp

## 📋 Descripción General

Este chatbot de WhatsApp ahora incluye un sistema completo de tienda virtual que permite:
- ✅ Mostrar productos organizados por categorías
- ✅ Búsqueda inteligente de productos
- ✅ Carrito de compras
- ✅ Proceso de checkout
- ✅ Gestión de inventario desde Google Sheets
- ✅ Registro automático de ventas

## 🎯 Características Principales

### 1. **Gestión desde Google Sheets**
Toda la información de la tienda se maneja desde un Google Sheet con 8 pestañas:

- **PRODUCTOS**: Catálogo de productos con precios, stock, descripciones
- **CATEGORIAS**: Categorías de productos con emojis
- **VENTAS**: Registro automático de todas las ventas
- **INFO_TIENDA**: Información general (horario, dirección, envío)
- **MENSAJES**: Mensajes personalizables del bot
- **BOTONES**: Botones interactivos del menú
- **METODOS_PAGO**: Métodos de pago disponibles
- **CONFIGURACION**: Configuración del sistema

### 2. **Menú Interactivo con Botones**
El bot responde con botones interactivos de WhatsApp para facilitar la navegación.

### 3. **Carrito de Compras**
Sistema completo de carrito que:
- Almacena productos temporalmente
- Calcula totales automáticamente
- Expira después de 30 minutos de inactividad
- Permite agregar, modificar y eliminar productos

### 4. **Búsqueda Inteligente**
La IA ayuda a los clientes a encontrar productos mediante:
- Búsqueda por texto
- Navegación por categorías
- Sugerencias basadas en consultas

## 📱 Comandos Disponibles para Clientes

### Comandos Básicos
```
menu / inicio          → Mostrar menú principal
ver productos         → Ver catálogo de productos
ver carrito          → Ver carrito de compras
buscar [producto]    → Buscar productos
agregar [código]     → Agregar producto al carrito
agregar [código] x2  → Agregar múltiples unidades
comprar / pagar      → Finalizar compra
/ayuda               → Mostrar ayuda
/nueva               → Iniciar nueva conversación
```

### Ejemplos de Uso
```
Cliente: "menu"
Bot: Muestra menú principal con botones

Cliente: "buscar laptop"
Bot: Muestra laptops disponibles

Cliente: "agregar P001"
Bot: Agrega producto P001 al carrito

Cliente: "agregar P002 x3"
Bot: Agrega 3 unidades del producto P002

Cliente: "ver carrito"
Bot: Muestra resumen del carrito

Cliente: "comprar"
Bot: Inicia proceso de checkout
```

## 🔧 Configuración Inicial

### 1. Variables de Entorno
Asegúrate de tener estas variables en `.env.local`:

```env
# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=tu_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Otras variables existentes
DATABASE_URL=tu_database_url
KAPSO_API_KEY=tu_api_key
KAPSO_WEBHOOK_SECRET=tu_webhook_secret
OPENROUTER_API_KEY=tu_openrouter_key
```

### 2. Google Sheet
El Google Sheet debe estar compartido con la cuenta de servicio de Google Cloud.

**ID del Sheet actual:**
```
1RwoS6bkbhmurPZZaT-l9Adj1NqqEHTe2MHY5oXgkj6w
```

**URL:**
```
https://docs.google.com/spreadsheets/d/1RwoS6bkbhmurPZZaT-l9Adj1NqqEHTe2MHY5oXgkj6w/edit
```

### 3. Base de Datos
El sistema creará automáticamente una tabla `carts` para el carrito de compras.

## 📊 Gestión de Productos

### Agregar Productos
1. Abre el Google Sheet
2. Ve a la pestaña **PRODUCTOS**
3. Agrega una nueva fila con:
   - `id_producto`: Código único (ej: P001)
   - `nombre`: Nombre del producto
   - `precio`: Precio numérico
   - `stock`: Cantidad disponible
   - `categoria`: Categoría del producto
   - `descripcion`: Descripción breve
   - `imagen_url`: (Opcional) URL de imagen
   - `activo`: SI/NO

### Modificar Precios o Stock
1. Edita directamente en el Google Sheet
2. Los cambios se reflejan automáticamente en el bot
3. El caché se actualiza cada 5 minutos

### Desactivar Productos
Cambia la columna `activo` a "NO" para ocultar un producto sin eliminarlo.

## 💰 Gestión de Ventas

### Registro Automático
Cada venta se registra automáticamente en la pestaña **VENTAS** con:
- ID único de venta
- Fecha y hora
- Teléfono del cliente
- Nombre del cliente
- Productos comprados
- Total
- Estado (PENDIENTE/COMPLETADA/CANCELADA)

### Consultar Ventas
Abre el Google Sheet y revisa la pestaña **VENTAS** para ver todas las transacciones.

## 🎨 Personalización

### Mensajes del Bot
Edita la pestaña **MENSAJES** para personalizar:
- Mensaje de bienvenida
- Mensajes de confirmación
- Mensajes de error
- Despedidas

### Botones del Menú
Edita la pestaña **BOTONES** para cambiar:
- Texto de los botones
- Emojis
- IDs de los botones

### Métodos de Pago
Edita la pestaña **METODOS_PAGO** para:
- Agregar nuevos métodos
- Modificar instrucciones
- Cambiar emojis

### Configuración General
Edita la pestaña **CONFIGURACION** para ajustar:
- Tiempo de expiración del carrito
- Máximo de productos por carrito
- Mostrar/ocultar imágenes
- Usar IA para búsqueda
- Notificaciones al administrador

## 🔄 Flujo de Compra

```
1. Cliente: "menu"
   → Bot muestra menú con categorías

2. Cliente: "buscar laptop"
   → Bot muestra laptops disponibles

3. Cliente: "agregar P001"
   → Bot confirma producto agregado

4. Cliente: "ver carrito"
   → Bot muestra resumen del carrito

5. Cliente: "comprar"
   → Bot muestra métodos de pago

6. Cliente selecciona método de pago
   → Bot muestra instrucciones de pago

7. Venta se registra en Google Sheets
```

## 🛠️ Mantenimiento

### Limpiar Carritos Expirados
Los carritos se limpian automáticamente después de 30 minutos de inactividad.

### Actualizar Caché
El caché de productos se actualiza automáticamente cada 5 minutos. Para forzar actualización:
```javascript
// En el código, llamar:
await getStoreData(true); // true = forzar actualización
```

### Monitoreo
Revisa los logs de la aplicación para:
- Errores de Google Sheets
- Problemas de stock
- Ventas completadas

## 📈 Mejores Prácticas

### 1. Gestión de Stock
- Actualiza el stock regularmente
- Desactiva productos sin stock
- Usa alertas cuando el stock sea bajo

### 2. Precios
- Mantén precios actualizados
- Usa formato numérico sin símbolos
- Considera descuentos en la descripción

### 3. Descripciones
- Sé claro y conciso
- Incluye características principales
- Usa emojis para destacar

### 4. Categorías
- Mantén categorías organizadas
- Usa nombres descriptivos
- Limita a 5-7 categorías principales

### 5. Imágenes
- Usa URLs públicas y estables
- Optimiza el tamaño de las imágenes
- Verifica que las URLs funcionen

## 🚨 Solución de Problemas

### El bot no muestra productos
1. Verifica que el Google Sheet esté compartido con la cuenta de servicio
2. Revisa que `GOOGLE_SHEETS_SPREADSHEET_ID` sea correcto
3. Verifica que los productos tengan `activo = SI`

### Error al agregar al carrito
1. Verifica que el código del producto sea correcto
2. Revisa que haya stock disponible
3. Verifica que la base de datos esté funcionando

### Los cambios no se reflejan
1. Espera 5 minutos (tiempo de caché)
2. O reinicia la aplicación para limpiar caché

### Errores de Google Sheets
1. Verifica las credenciales de la cuenta de servicio
2. Revisa que las APIs estén habilitadas en Google Cloud
3. Verifica los permisos del Sheet

## 📞 Soporte

Para soporte técnico o preguntas:
1. Revisa los logs de la aplicación
2. Verifica la configuración de Google Sheets
3. Consulta la documentación de Google Cloud

## 🎉 Próximas Funcionalidades

Funcionalidades planeadas para futuras versiones:
- [ ] Generación automática de facturas en PDF
- [ ] Almacenamiento de facturas en Google Drive
- [ ] Notificaciones al administrador por WhatsApp
- [ ] Reportes de ventas automáticos
- [ ] Integración con pasarelas de pago
- [ ] Sistema de cupones de descuento
- [ ] Programa de puntos/fidelidad

---

**Versión:** 1.0.0  
**Última actualización:** 2026-04-24