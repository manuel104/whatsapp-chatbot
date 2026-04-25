# Configuración de Google Drive para Facturas

## ❌ Problema

Las Service Accounts de Google **no tienen cuota de almacenamiento propia**, por lo que no pueden subir archivos directamente a "Mi unidad". 

Error:
```
Service Accounts do not have storage quota. 
Leverage shared drives or use OAuth delegation instead.
```

## ✅ Solución

Crear una **carpeta en tu Google Drive** y compartirla con la Service Account para que pueda subir archivos ahí.

---

## 📋 Pasos para Configurar

### 1. Crear Carpeta en Google Drive

1. Ve a [Google Drive](https://drive.google.com)
2. Crea una nueva carpeta llamada **"Facturas WhatsApp Bot"** (o el nombre que prefieras)
3. Haz clic derecho en la carpeta → **Compartir**

### 2. Compartir con Service Account

1. En el campo "Agregar personas y grupos", pega el **email de tu Service Account**
   - Lo encuentras en tu archivo JSON de credenciales
   - Tiene formato: `nombre-proyecto@nombre-proyecto.iam.gserviceaccount.com`
   
2. Selecciona el rol: **Editor** (para que pueda subir archivos)

3. Haz clic en **Enviar**

### 3. Obtener el ID de la Carpeta

1. Abre la carpeta en Google Drive
2. Mira la URL en tu navegador:
   ```
   https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j
                                            ^^^^^^^^^^^^^^^^^^^^
                                            Este es el FOLDER_ID
   ```
3. Copia el ID de la carpeta (la parte después de `/folders/`)

### 4. Agregar Variable de Entorno

Agrega esta variable a tu archivo `.env`:

```env
GOOGLE_DRIVE_FOLDER_ID=1a2b3c4d5e6f7g8h9i0j
```

Reemplaza `1a2b3c4d5e6f7g8h9i0j` con el ID real de tu carpeta.

---

## 🔍 Verificación

Para verificar que todo está configurado correctamente:

1. **Service Account tiene acceso:**
   - Ve a la carpeta en Google Drive
   - Haz clic en el ícono de compartir
   - Deberías ver el email de la Service Account con rol "Editor"

2. **Variable de entorno configurada:**
   ```bash
   echo $GOOGLE_DRIVE_FOLDER_ID
   ```
   Debería mostrar el ID de tu carpeta

3. **Prueba subiendo una factura:**
   - Aprueba un pedido
   - Verifica que la factura aparezca en la carpeta de Google Drive

---

## 📁 Estructura Recomendada

Puedes organizar las facturas por mes creando subcarpetas:

```
📁 Facturas WhatsApp Bot/
  📁 2026-01/
  📁 2026-02/
  📁 2026-03/
  📄 Factura_ORD123_timestamp.pdf
  📄 Factura_ORD456_timestamp.pdf
```

---

## 🔐 Seguridad

- ✅ Solo la Service Account y tú tienen acceso a la carpeta
- ✅ Los clientes reciben un link público de solo lectura
- ✅ Las facturas no se pueden editar ni eliminar por los clientes
- ✅ Puedes revocar el acceso en cualquier momento

---

## 🆘 Solución de Problemas

### Error: "GOOGLE_DRIVE_FOLDER_ID environment variable is required"

**Causa:** No has configurado la variable de entorno.

**Solución:** Agrega `GOOGLE_DRIVE_FOLDER_ID` a tu `.env`

### Error: "Insufficient Permission"

**Causa:** La Service Account no tiene permisos en la carpeta.

**Solución:** 
1. Verifica que compartiste la carpeta con el email correcto
2. Asegúrate de dar rol "Editor" (no "Viewer")

### Las facturas no aparecen en la carpeta

**Causa:** Estás usando el ID incorrecto.

**Solución:**
1. Verifica que copiaste el ID completo de la URL
2. No incluyas `/folders/` en el ID, solo la parte alfanumérica

---

## ✅ Checklist Final

- [ ] Carpeta creada en Google Drive
- [ ] Carpeta compartida con Service Account (rol Editor)
- [ ] ID de carpeta copiado
- [ ] Variable `GOOGLE_DRIVE_FOLDER_ID` agregada a `.env`
- [ ] Servidor reiniciado después de agregar la variable
- [ ] Prueba realizada aprobando un pedido

---

## 📝 Ejemplo Completo

```env
# .env
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_SPREADSHEET_ID=1abc...xyz
GOOGLE_DRIVE_FOLDER_ID=1a2b3c4d5e6f7g8h9i0j  # ← Agregar esta línea
```

Una vez configurado, las facturas se subirán automáticamente a esta carpeta y los clientes recibirán el link de descarga. 🎉