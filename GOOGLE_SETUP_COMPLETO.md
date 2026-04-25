# 🔐 Guía Completa: Configuración de Google Cloud desde Cero

## 📋 PASO 1: Crear Proyecto en Google Cloud

1. Ve a https://console.cloud.google.com
2. Clic en el selector de proyectos (arriba a la izquierda, al lado del logo de Google Cloud)
3. Clic en **"NEW PROJECT"** (NUEVO PROYECTO)
4. Llena los datos:
   - **Project name:** `whatsapp-chatbot-store`
   - **Location:** Dejar como está (No organization)
5. Clic en **"CREATE"** (CREAR)
6. **ESPERA 30 segundos** mientras se crea el proyecto
7. Verás una notificación cuando esté listo
8. Clic en **"SELECT PROJECT"** (SELECCIONAR PROYECTO)

---

## 🔌 PASO 2: Habilitar Google Sheets API

1. Con el proyecto seleccionado, ve al menú lateral (☰)
2. Ve a **"APIs & Services"** > **"Library"**
3. En el buscador, escribe: `Google Sheets API`
4. Clic en **"Google Sheets API"** (el primer resultado)
5. Clic en el botón azul **"ENABLE"** (HABILITAR)
6. **ESPERA 10 segundos** mientras se habilita
7. Verás "API enabled" cuando esté listo

---

## 🔌 PASO 3: Habilitar Google Drive API

1. Clic en el botón **"← "** (atrás) o ve de nuevo a **"APIs & Services"** > **"Library"**
2. En el buscador, escribe: `Google Drive API`
3. Clic en **"Google Drive API"** (el primer resultado)
4. Clic en el botón azul **"ENABLE"** (HABILITAR)
5. **ESPERA 10 segundos** mientras se habilita
6. Verás "API enabled" cuando esté listo

---

## 🤖 PASO 4: Crear Service Account

1. Ve al menú lateral (☰)
2. Ve a **"APIs & Services"** > **"Credentials"** (Credenciales)
3. Clic en **"+ CREATE CREDENTIALS"** (arriba)
4. Selecciona **"Service Account"**
5. Llena el formulario:
   - **Service account name:** `chatbot-service`
   - **Service account ID:** (se genera automáticamente)
   - **Description:** `Service account para chatbot de WhatsApp`
6. Clic en **"CREATE AND CONTINUE"** (CREAR Y CONTINUAR)

---

## 👤 PASO 5: Asignar Permisos al Service Account

1. En la sección "Grant this service account access to project":
2. En el campo **"Select a role"** (Seleccionar un rol):
   - Busca: `Owner`
   - O selecciona: **"Project"** > **"Owner"**
3. Clic en **"CONTINUE"** (CONTINUAR)
4. Clic en **"DONE"** (LISTO)

---

## 🔑 PASO 6: Crear y Descargar la Clave JSON

1. En la página de **"Credentials"**, verás tu Service Account en la lista
2. Clic en el **email del Service Account** (algo como `chatbot-service@whatsapp-chatbot-store.iam.gserviceaccount.com`)
3. Ve a la pestaña **"KEYS"** (CLAVES)
4. Clic en **"ADD KEY"** (AGREGAR CLAVE)
5. Selecciona **"Create new key"** (Crear clave nueva)
6. Selecciona formato **"JSON"**
7. Clic en **"CREATE"** (CREAR)
8. **Se descargará automáticamente un archivo JSON**
9. **IMPORTANTE:** Guarda este archivo de forma segura

---

## 📁 PASO 7: Configurar el Archivo de Credenciales

1. Busca el archivo JSON que se descargó (probablemente en tu carpeta de Descargas)
2. El nombre será algo como: `whatsapp-chatbot-store-abc123.json`
3. **Renombra el archivo a:** `google-credentials.json`
4. **Mueve el archivo a la raíz de tu proyecto:**
   ```
   whatsapp-chatbot/
   ├── google-credentials.json  ← Aquí (al lado de package.json)
   ├── package.json
   ├── ...
   ```

---

## ✅ PASO 8: Verificar que Todo Funcione

1. Abre una terminal en la raíz del proyecto
2. Ejecuta:
   ```bash
   node scripts/test-google-auth.js
   ```
3. Si todo está bien, verás:
   ```
   ✅ Autenticación exitosa
   ✅ Google Sheets API funciona correctamente
   📊 Spreadsheet creado: [ID]
   ```

---

## 🎯 PASO 9: Crear el Google Sheet con Datos

Si el paso 8 funcionó, ejecuta:
```bash
node scripts/create-google-sheet.js
```

Esto creará automáticamente:
- ✅ Un Google Sheet nuevo
- ✅ 8 hojas con estructura completa
- ✅ Datos de ejemplo
- ✅ Formato profesional

---

## 🔍 Verificar que las APIs estén Habilitadas

Para verificar que las APIs estén habilitadas:

1. Ve a https://console.cloud.google.com/apis/dashboard?project=whatsapp-chatbot-store
2. Deberías ver en la lista:
   - ✅ Google Sheets API
   - ✅ Google Drive API

Si no las ves, repite los PASOS 2 y 3.

---

## ⚠️ Solución de Problemas Comunes

### Error: "The caller does not have permission"
**Causa:** Las APIs no están habilitadas o el Service Account no tiene permisos

**Solución:**
1. Verifica que ambas APIs estén habilitadas (PASOS 2 y 3)
2. Verifica que el Service Account tenga rol de Owner (PASO 5)
3. Espera 1-2 minutos para que los permisos se propaguen
4. Intenta de nuevo

### Error: "File not found: google-credentials.json"
**Causa:** El archivo no está en la ubicación correcta

**Solución:**
1. Verifica que el archivo esté en la raíz del proyecto
2. Verifica que se llame exactamente `google-credentials.json`
3. Verifica que no esté en una subcarpeta

### Error: "Invalid credentials"
**Causa:** El archivo JSON está corrupto o es incorrecto

**Solución:**
1. Elimina el archivo actual
2. Repite el PASO 6 para descargar uno nuevo
3. Asegúrate de no editar el archivo JSON

---

## 📝 Checklist Final

Antes de continuar, verifica que hayas completado:

- [ ] Proyecto de Google Cloud creado
- [ ] Google Sheets API habilitada
- [ ] Google Drive API habilitada
- [ ] Service Account creado con rol de Owner
- [ ] Archivo JSON descargado
- [ ] Archivo renombrado a `google-credentials.json`
- [ ] Archivo movido a la raíz del proyecto
- [ ] Script de prueba ejecutado exitosamente
- [ ] Google Sheet creado con datos de ejemplo

---

## 🎉 ¡Listo!

Si completaste todos los pasos, ya tienes:
- ✅ Google Cloud configurado correctamente
- ✅ Service Account con permisos
- ✅ APIs habilitadas
- ✅ Credenciales configuradas
- ✅ Google Sheet creado y listo para usar

**Próximo paso:** Empezar a codificar la integración del chatbot con Google Sheets

---

**Fecha:** 25/04/2024
**Versión:** 2.0 - Guía Completa Paso a Paso
