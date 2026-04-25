# 🚀 Guía de Despliegue a Vercel

## 📋 Pasos para Subir a Git y Desplegar en Vercel

### 1. Preparar el Repositorio Git

```bash
# Verificar estado de git
git status

# Agregar todos los archivos nuevos
git add .

# Hacer commit con mensaje descriptivo
git commit -m "feat: Sistema de tienda completo con Google Sheets, carrito y botones interactivos"

# Subir a GitHub
git push origin main
```

### 2. Variables de Entorno en Vercel

Antes de desplegar, debes configurar estas variables de entorno en Vercel:

#### Variables Requeridas:

1. **DATABASE_URL**
   - Tu URL de Neon/Vercel Postgres
   - Ejemplo: `postgresql://user:pass@host/db?sslmode=require`

2. **KAPSO_API_KEY**
   - Tu API key de Kapso
   - Ejemplo: `kp_live_xxxxxxxxxxxxx`

3. **KAPSO_WEBHOOK_SECRET**
   - Tu webhook secret de Kapso
   - Ejemplo: `whsec_xxxxxxxxxxxxx`

4. **OPENROUTER_API_KEY**
   - Tu API key de OpenRouter
   - Ejemplo: `sk-or-v1-xxxxxxxxxxxxx`

5. **GOOGLE_SHEETS_SPREADSHEET_ID**
   - ID de tu Google Sheet
   - Valor actual: `1RwoS6bkbhmurPZZaT-l9Adj1NqqEHTe2MHY5oXgkj6w`

6. **GOOGLE_SERVICE_ACCOUNT_KEY**
   - JSON completo de las credenciales de Google Cloud
   - **IMPORTANTE:** Debe ser el JSON completo en una sola línea
   - Copia todo el contenido de `google-credentials.json`

### 3. Configurar Variables en Vercel

#### Opción A: Desde la Web de Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega cada variable:
   - Name: `DATABASE_URL`
   - Value: (pega tu valor)
   - Environment: Production, Preview, Development (selecciona todos)
   - Click **Save**
5. Repite para todas las variables

#### Opción B: Desde la CLI de Vercel

```bash
# Instalar Vercel CLI si no la tienes
npm i -g vercel

# Login a Vercel
vercel login

# Agregar variables de entorno
vercel env add DATABASE_URL
# Pega el valor cuando te lo pida

vercel env add KAPSO_API_KEY
vercel env add KAPSO_WEBHOOK_SECRET
vercel env add OPENROUTER_API_KEY
vercel env add GOOGLE_SHEETS_SPREADSHEET_ID
vercel env add GOOGLE_SERVICE_ACCOUNT_KEY
```

### 4. Desplegar a Vercel

#### Opción A: Despliegue Automático (Recomendado)

1. Conecta tu repositorio de GitHub a Vercel:
   - Ve a https://vercel.com/new
   - Selecciona tu repositorio
   - Vercel detectará automáticamente que es Next.js
   - Click en **Deploy**

2. Vercel desplegará automáticamente en cada push a `main`

#### Opción B: Despliegue Manual con CLI

```bash
# Desplegar a producción
vercel --prod

# O simplemente
vercel
```

### 5. Verificar el Despliegue

1. **Verifica que la aplicación esté corriendo:**
   - URL de producción: `https://tu-proyecto.vercel.app`
   - Prueba: `https://tu-proyecto.vercel.app/api/webhook/whatsapp`
   - Deberías ver un error 405 (Method Not Allowed) - esto es normal

2. **Verifica las variables de entorno:**
   ```bash
   vercel env ls
   ```

3. **Revisa los logs:**
   ```bash
   vercel logs
   ```

### 6. Actualizar Webhook en Kapso

Una vez desplegado, actualiza la URL del webhook en Kapso:

```
https://tu-proyecto.vercel.app/api/webhook/whatsapp
```

### 7. Probar el Sistema

Envía un mensaje de WhatsApp al número configurado:

```
Prueba 1: "menu"
Prueba 2: "buscar laptop"
Prueba 3: "agregar P001"
Prueba 4: "ver carrito"
Prueba 5: "comprar"
```

## 🔧 Solución de Problemas

### Error: "GOOGLE_SERVICE_ACCOUNT_KEY is not configured"

**Solución:**
1. Verifica que la variable esté configurada en Vercel
2. Asegúrate de que sea el JSON completo
3. Verifica que no tenga saltos de línea adicionales
4. Redeploy después de agregar la variable

### Error: "The caller does not have permission"

**Solución:**
1. Verifica que el Google Sheet esté compartido con la cuenta de servicio
2. Email de la cuenta de servicio está en `google-credentials.json` → `client_email`
3. Comparte el Sheet con ese email con permisos de Editor

### Error: Database connection failed

**Solución:**
1. Verifica que `DATABASE_URL` esté correcta
2. Asegúrate de que incluya `?sslmode=require`
3. Verifica que la base de datos esté activa en Neon/Vercel

### Error: Cannot read properties of undefined

**Solución:**
1. Revisa los logs: `vercel logs`
2. Verifica que todas las variables de entorno estén configuradas
3. Redeploy: `vercel --prod --force`

## 📝 Checklist de Despliegue

- [ ] Código subido a GitHub
- [ ] Variables de entorno configuradas en Vercel
- [ ] Google Sheet compartido con cuenta de servicio
- [ ] Proyecto desplegado en Vercel
- [ ] Webhook actualizado en Kapso
- [ ] Pruebas realizadas con mensajes de WhatsApp
- [ ] Logs revisados sin errores
- [ ] Productos visibles en el menú
- [ ] Carrito funcionando correctamente

## 🎯 Comandos Útiles

```bash
# Ver logs en tiempo real
vercel logs --follow

# Ver variables de entorno
vercel env ls

# Eliminar variable de entorno
vercel env rm VARIABLE_NAME

# Redeploy forzado
vercel --prod --force

# Ver información del proyecto
vercel inspect

# Ver dominios
vercel domains ls
```

## 🔄 Actualizaciones Futuras

Para actualizar el código en producción:

```bash
# 1. Hacer cambios en el código
# 2. Commit y push
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main

# 3. Vercel desplegará automáticamente
# O manualmente:
vercel --prod
```

## 📊 Monitoreo

1. **Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Revisa métricas, logs y errores

2. **Google Sheets:**
   - Revisa la pestaña VENTAS para ver transacciones
   - Actualiza productos según necesites

3. **Base de Datos:**
   - Usa Neon/Vercel dashboard para ver datos
   - Revisa tabla `carts` para carritos activos

## 🎉 ¡Listo!

Tu chatbot de WhatsApp con sistema de tienda está ahora en producción. Los clientes pueden:
- Ver productos
- Buscar artículos
- Agregar al carrito
- Realizar compras
- Todo gestionado desde Google Sheets

---

**Nota:** Recuerda que el caché de productos se actualiza cada 5 minutos. Los cambios en Google Sheets pueden tardar hasta 5 minutos en reflejarse.