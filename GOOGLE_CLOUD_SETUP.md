# 🔐 Configuración de Google Cloud para el Chatbot

## 📋 Resumen
Necesitas configurar Google Cloud para que el chatbot pueda acceder a Google Sheets y Google Drive.

---

## 🚀 Paso 1: Crear Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Clic en el selector de proyectos (arriba a la izquierda)
3. Clic en **"NEW PROJECT"**
4. Nombre del proyecto: `whatsapp-chatbot-store`
5. Clic en **"CREATE"**
6. Espera a que se cree el proyecto (30 segundos aprox)

---

## 🔌 Paso 2: Habilitar APIs

### Google Sheets API
1. En el menú lateral, ve a **"APIs & Services"** > **"Library"**
2. Busca: `Google Sheets API`
3. Clic en **"Google Sheets API"**
4. Clic en **"ENABLE"**

### Google Drive API
1. En la misma página de Library
2. Busca: `Google Drive API`
3. Clic en **"Google Drive API"**
4. Clic en **"ENABLE"**

---

## 🤖 Paso 3: Crear Service Account

1. Ve a **"APIs & Services"** > **"Credentials"**
2. Clic en **"+ CREATE CREDENTIALS"**
3. Selecciona **"Service Account"**
4. Llena los datos:
   - **Service account name:** `chatbot-service`
   - **Service account ID:** (se genera automáticamente)
   - **Description:** `Service account para chatbot de WhatsApp`
5. Clic en **"CREATE AND CONTINUE"**
6. En "Grant this service account access to project":
   - Selecciona rol: **"Editor"**
7. Clic en **"CONTINUE"**
8. Clic en **"DONE"**

---

## 🔑 Paso 4: Descargar Credenciales JSON

1. En la página de Credentials, busca tu Service Account
2. Clic en el email del Service Account (algo como `chatbot-service@...`)
3. Ve a la pestaña **"KEYS"**
4. Clic en **"ADD KEY"** > **"Create new key"**
5. Selecciona **"JSON"**
6. Clic en **"CREATE"**
7. Se descargará un archivo JSON automáticamente
8. **IMPORTANTE:** Guarda este archivo de forma segura

---

## 📁 Paso 5: Configurar Credenciales en el Proyecto

### Opción A: Archivo en el proyecto (Desarrollo)
1. Renombra el archivo descargado a: `google-credentials.json`
2. Muévelo a la raíz de tu proyecto:
   ```
   whatsapp-chatbot/
   ├── google-credentials.json  ← Aquí
   ├── package.json
   ├── ...
   ```
3. Agrega a `.gitignore`:
   ```
   google-credentials.json
   ```

### Opción B: Variable de entorno (Producción)
1. Abre el archivo JSON descargado
2. Copia TODO el contenido
3. En tu archivo `.env`:
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL=chatbot-service@tu-proyecto.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA_AQUI\n-----END PRIVATE KEY-----\n"
   ```

**IMPORTANTE para Cloudflare Workers:**
- La clave privada debe estar en una sola línea
- Reemplaza los saltos de línea reales con `\n`
- Mantén las comillas dobles

---

## ✅ Paso 6: Verificar Configuración

Ejecuta el script de prueba:

```bash
node scripts/create-google-sheet.js
```

Si todo está bien configurado, verás:
```
✅ Autenticación exitosa
📊 Creando Google Sheet...
✅ Google Sheet creado: 1abc123xyz456
```

---

## 🔐 Paso 7: Copiar Email del Service Account

1. Ve a **"APIs & Services"** > **"Credentials"**
2. Busca tu Service Account
3. Copia el email (algo como):
   ```
   chatbot-service@whatsapp-chatbot-store.iam.gserviceaccount.com
   ```
4. **Guárdalo** - lo necesitarás para compartir el Google Sheet

---

## 📊 Paso 8: Ejecutar Script de Creación

Ahora sí, ejecuta el script para crear el Google Sheet:

```bash
node scripts/create-google-sheet.js
```

El script:
- ✅ Creará un Google Sheet nuevo
- ✅ Agregará las 8 hojas necesarias
- ✅ Llenará con datos de ejemplo
- ✅ Aplicará formato y colores
- ✅ Te dará el SPREADSHEET_ID

---

## 🎯 Paso 9: Configurar Variables de Entorno

Agrega al archivo `.env`:

```env
# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=1abc123xyz456  # Del paso anterior
GOOGLE_SERVICE_ACCOUNT_EMAIL=chatbot-service@tu-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google Drive (opcional, para facturas)
GOOGLE_DRIVE_FOLDER_ID=1xyz789abc  # Crea una carpeta en Drive y copia su ID
```

---

## 🔍 Solución de Problemas

### Error: "The caller does not have permission"
- Verifica que habilitaste Google Sheets API
- Verifica que el Service Account tenga rol de Editor

### Error: "Invalid credentials"
- Verifica que el archivo JSON esté en la ubicación correcta
- Verifica que no haya espacios extra en las variables de entorno

### Error: "File not found"
- Verifica la ruta del archivo `google-credentials.json`
- O configura `GOOGLE_APPLICATION_CREDENTIALS` con la ruta completa

---

## 📝 Checklist Final

Antes de continuar, verifica:

- [ ] Proyecto de Google Cloud creado
- [ ] Google Sheets API habilitada
- [ ] Google Drive API habilitada
- [ ] Service Account creado
- [ ] Credenciales JSON descargadas
- [ ] Archivo `google-credentials.json` en el proyecto
- [ ] Variables de entorno configuradas
- [ ] Script ejecutado exitosamente
- [ ] Google Sheet creado y accesible
- [ ] SPREADSHEET_ID copiado

---

## 🎉 ¡Listo!

Si completaste todos los pasos, ya tienes:
- ✅ Google Cloud configurado
- ✅ Service Account con permisos
- ✅ Google Sheet creado con datos de ejemplo
- ✅ Variables de entorno configuradas

**Próximo paso:** Empezar a codificar la integración del chatbot con Google Sheets

---

**Fecha:** 25/04/2024
**Versión:** 1.0
