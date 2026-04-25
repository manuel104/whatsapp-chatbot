# 📊 Guía: Crear Google Sheet para el Chatbot de Tienda

## 🎯 Objetivo
Crear un Google Sheet con toda la información de tu tienda que el chatbot usará para funcionar.

---

## 📝 Paso 1: Crear el Google Sheet

1. Ve a [Google Sheets](https://sheets.google.com)
2. Clic en **"+ Blank"** (Hoja en blanco)
3. Nombra el archivo: **"Tienda WhatsApp Bot - [Nombre de tu tienda]"**

---

## 📋 Paso 2: Crear las 8 Hojas

Renombra y crea las siguientes hojas (pestañas en la parte inferior):

1. **PRODUCTOS**
2. **CATEGORIAS**
3. **VENTAS**
4. **INFO_TIENDA**
5. **MENSAJES**
6. **BOTONES**
7. **METODOS_PAGO**
8. **CONFIGURACION**

---

## 🛍️ Hoja 1: PRODUCTOS

### Columnas (Fila 1):
```
A: id
B: nombre
C: precio
D: stock
E: categoria
F: descripcion
G: imagen_url
H: activo
```

### Datos de Ejemplo (Filas 2+):
```
P001 | Camiseta Básica Blanca | 45000 | 15 | Ropa | Camiseta 100% algodón, talla M | https://ejemplo.com/img1.jpg | SI
P002 | Pantalón Jean Azul | 89000 | 8 | Ropa | Jean clásico azul oscuro, talla 32 | https://ejemplo.com/img2.jpg | SI
P003 | Zapatos Deportivos Nike | 120000 | 5 | Calzado | Zapatos running Nike Air, talla 42 | https://ejemplo.com/img3.jpg | SI
P004 | Gorra Snapback Negra | 35000 | 20 | Accesorios | Gorra ajustable color negro | https://ejemplo.com/img4.jpg | SI
P005 | Reloj Digital Casio | 150000 | 3 | Accesorios | Reloj digital resistente al agua | https://ejemplo.com/img5.jpg | SI
P006 | Chaqueta Deportiva | 95000 | 0 | Ropa | Chaqueta impermeable talla L | https://ejemplo.com/img6.jpg | NO
```

**Notas:**
- `id`: Código único del producto (P001, P002, etc.)
- `precio`: Precio en pesos colombianos (sin puntos ni comas)
- `stock`: Cantidad disponible (0 = agotado)
- `categoria`: Debe coincidir con las categorías de la Hoja 2
- `imagen_url`: URL de la imagen (opcional, puede estar vacío)
- `activo`: SI = se muestra en el catálogo, NO = oculto

---

## 📦 Hoja 2: CATEGORIAS

### Columnas (Fila 1):
```
A: nombre
B: descripcion
C: emoji
```

### Datos de Ejemplo (Filas 2+):
```
Ropa | Prendas de vestir para toda ocasión | 👕
Calzado | Zapatos y sandalias de calidad | 👟
Accesorios | Complementos y accesorios de moda | 🎒
Electrónica | Dispositivos y gadgets tecnológicos | 📱
```

**Notas:**
- `nombre`: Debe coincidir exactamente con la columna `categoria` de PRODUCTOS
- `emoji`: Emoji que se mostrará en los botones (copia y pega desde [Emojipedia](https://emojipedia.org))

---

## 💰 Hoja 3: VENTAS

### Columnas (Fila 1):
```
A: id_venta
B: fecha
C: cliente_tel
D: cliente_nombre
E: productos
F: total
G: estado
H: factura_url
```

### Datos de Ejemplo (Filas 2+):
```
V001 | 2024-04-24 | 573205293532 | Manuel Orrego | P001x2,P003x1 | 210000 | COMPLETADA | https://drive.google.com/...
V002 | 2024-04-24 | 573001234567 | Ana García | P002x1 | 89000 | PENDIENTE | https://drive.google.com/...
```

**Notas:**
- Esta hoja se llenará automáticamente cuando haya ventas
- `productos`: Formato "IDxCANTIDAD" separado por comas
- `estado`: PENDIENTE, COMPLETADA, CANCELADA
- Puedes dejar esta hoja vacía (solo con encabezados)

---

## 🏪 Hoja 4: INFO_TIENDA

### Columnas (Fila 1):
```
A: campo
B: valor
```

### Datos de Ejemplo (Filas 2+):
```
nombre_tienda | Fashion Store Colombia
horario | Lun-Sab 9am-7pm, Dom 10am-2pm
direccion | Calle 123 #45-67, Bogotá, Colombia
telefono | +57 300 123 4567
email | ventas@fashionstore.com
envio_gratis_min | 100000
metodos_pago | Efectivo, Nequi, Bancolombia, Daviplata
tiempo_entrega | 2-3 días hábiles
moneda | COP
simbolo_moneda | $
```

**Notas:**
- `envio_gratis_min`: Monto mínimo para envío gratis (en pesos)
- Personaliza todos los valores con la información real de tu tienda

---

## 💬 Hoja 5: MENSAJES

### Columnas (Fila 1):
```
A: clave
B: mensaje
```

### Datos de Ejemplo (Filas 2+):
```
bienvenida | 👋 ¡Hola {nombre}! Bienvenido a {tienda}. ¿En qué puedo ayudarte hoy?
menu_principal | ¿Qué deseas hacer?
producto_agregado | ✅ {producto} agregado al carrito exitosamente
carrito_vacio | 🛒 Tu carrito está vacío. ¡Empieza a comprar!
pedido_confirmado | ✅ ¡Pedido confirmado! Tu número de factura es #{factura}
sin_stock | ❌ Lo sentimos, {producto} está agotado en este momento
error_general | ⚠️ Ocurrió un error. Por favor intenta de nuevo
despedida | 👋 ¡Gracias por tu compra! Vuelve pronto a {tienda}
selecciona_categoria | 📦 Selecciona una categoría para ver los productos:
escribe_busqueda | 🔍 Escribe el nombre del producto que buscas:
producto_no_encontrado | ❌ No encontramos productos con ese nombre. Intenta con otro término
confirmacion_compra | 📋 Confirma tu pedido:\n\n📦 Productos: {cantidad} items\n💰 Total: {total}\n🚚 Envío: {envio}\n📍 Entrega: {tiempo_entrega}
selecciona_pago | 💳 Selecciona tu método de pago:
gracias_compra | 🎉 ¡Gracias por tu compra, {nombre}! Nos contactaremos pronto para coordinar la entrega
```

**Notas:**
- Variables disponibles: `{nombre}`, `{tienda}`, `{producto}`, `{factura}`, `{cantidad}`, `{total}`, `{envio}`, `{tiempo_entrega}`
- Usa `\n` para saltos de línea
- Personaliza los mensajes según el tono de tu marca

---

## 🔘 Hoja 6: BOTONES

### Columnas (Fila 1):
```
A: id_boton
B: texto
C: emoji
```

### Datos de Ejemplo (Filas 2+):
```
ver_productos | Ver Productos | 🛍️
buscar | Buscar | 🔍
mi_carrito | Mi Carrito | 🛒
ayuda | Ayuda | ❓
finalizar_compra | Finalizar | ✅
vaciar_carrito | Vaciar | 🗑️
seguir_comprando | Seguir | ⬅️
volver_menu | Menú | 🏠
volver_categorias | Categorías | 🔙
agregar_carrito | Agregar | ➕
quitar_carrito | Quitar | ➖
eliminar_producto | Eliminar | 🗑️
```

**Notas:**
- `texto`: Máximo 20 caracteres (limitación de WhatsApp)
- `emoji`: Opcional pero recomendado para mejor UX
- No cambies los `id_boton` (el código los usa internamente)

---

## 💳 Hoja 7: METODOS_PAGO

### Columnas (Fila 1):
```
A: id
B: nombre
C: emoji
D: instrucciones
```

### Datos de Ejemplo (Filas 2+):
```
efectivo | Efectivo | 💵 | Pago contra entrega. Prepara el monto exacto
nequi | Nequi | 📱 | Enviar a: 300-123-4567 a nombre de Fashion Store
bancolombia | Bancolombia | 🏦 | Cuenta Ahorros: 123-456789-01 a nombre de Fashion Store
daviplata | Daviplata | 💳 | Enviar a: 320-987-6543 a nombre de Fashion Store
```

**Notas:**
- Agrega solo los métodos de pago que aceptas
- `instrucciones`: Información clara para que el cliente sepa cómo pagar
- Puedes agregar más métodos (PSE, tarjetas, etc.)

---

## ⚙️ Hoja 8: CONFIGURACION

### Columnas (Fila 1):
```
A: parametro
B: valor
C: descripcion
```

### Datos de Ejemplo (Filas 2+):
```
carrito_expira_min | 30 | Minutos antes de vaciar carrito automáticamente
max_productos_carrito | 20 | Máximo de items diferentes en el carrito
mostrar_imagenes | SI | Enviar imágenes de productos (SI/NO)
usar_ia_busqueda | SI | Usar IA para búsqueda inteligente (SI/NO)
idioma | es | Idioma del bot (es=español, en=inglés)
zona_horaria | -5 | UTC offset (Colombia = -5)
notificar_admin | SI | Notificar ventas al admin (SI/NO)
admin_telefono | 573001234567 | Teléfono del administrador
cache_productos_min | 5 | Minutos para actualizar caché de productos
max_resultados_busqueda | 10 | Máximo de productos en resultados de búsqueda
```

**Notas:**
- Estos valores controlan el comportamiento del bot
- Puedes ajustarlos según tus necesidades
- Los valores numéricos deben ser solo números (sin texto)

---

## 🔐 Paso 3: Compartir el Sheet con el Bot

1. Clic en **"Share"** (Compartir) en la esquina superior derecha
2. En "Add people and groups", pega este email:
   ```
   [TU_SERVICE_ACCOUNT_EMAIL]
   ```
   (Lo obtendrás cuando configures Google Cloud)
3. Selecciona **"Editor"** (para que el bot pueda escribir ventas)
4. Clic en **"Send"**

---

## 📋 Paso 4: Obtener el ID del Sheet

1. Mira la URL de tu Google Sheet, se ve así:
   ```
   https://docs.google.com/spreadsheets/d/1abc123xyz456/edit
   ```
2. Copia la parte entre `/d/` y `/edit`:
   ```
   1abc123xyz456
   ```
3. Este es tu **SPREADSHEET_ID** que usarás en el código

---

## ✅ Checklist Final

Antes de continuar con el código, verifica:

- [ ] Las 8 hojas están creadas con los nombres exactos
- [ ] Cada hoja tiene los encabezados correctos en la fila 1
- [ ] Agregaste al menos 3-5 productos de ejemplo
- [ ] Completaste INFO_TIENDA con tu información real
- [ ] Personalizaste los MENSAJES según tu marca
- [ ] Configuraste tus METODOS_PAGO reales
- [ ] Ajustaste la CONFIGURACION según tus necesidades
- [ ] Compartiste el Sheet con el Service Account
- [ ] Copiaste el SPREADSHEET_ID

---

## 🎨 Tips de Diseño

### Formato de Celdas
- **Encabezados (Fila 1):** Negrita, fondo gris claro
- **Precios:** Formato número sin decimales
- **Fechas:** Formato fecha corta (DD/MM/YYYY)

### Colores Sugeridos
- **PRODUCTOS:** Azul claro (#E3F2FD)
- **CATEGORIAS:** Verde claro (#E8F5E9)
- **VENTAS:** Amarillo claro (#FFF9C4)
- **INFO_TIENDA:** Naranja claro (#FFE0B2)
- **MENSAJES:** Morado claro (#F3E5F5)
- **BOTONES:** Rosa claro (#FCE4EC)
- **METODOS_PAGO:** Cyan claro (#E0F7FA)
- **CONFIGURACION:** Gris claro (#F5F5F5)

---

## 🚀 Próximos Pasos

Una vez tengas el Google Sheet listo:

1. ✅ Configura Google Cloud Project
2. ✅ Crea Service Account
3. ✅ Habilita Google Sheets API
4. ✅ Descarga credenciales JSON
5. ✅ Agrega variables de entorno al proyecto
6. ✅ Empieza a codificar la integración

---

## 📞 Soporte

Si tienes dudas sobre cómo llenar alguna hoja, pregúntame y te ayudo con ejemplos específicos para tu tipo de tienda.

**Fecha:** 25/04/2024
**Versión:** 1.0
