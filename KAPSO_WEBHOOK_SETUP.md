# 🔐 Cómo Obtener el Webhook Secret de Kapso

## Paso a Paso para Configurar el Webhook Secret

### Opción 1: Generar un Secret Personalizado (Recomendado)

El webhook secret es una clave que TÚ generas para verificar que los mensajes realmente vienen de Kapso. Puedes crear uno de estas formas:

#### Método 1: Generar con OpenSSL (Mac/Linux)
```bash
openssl rand -hex 32
```

#### Método 2: Generar con Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Método 3: Usar un generador online
Ve a: https://www.uuidgenerator.net/guid
O usa cualquier generador de strings aleatorios seguros

**Ejemplo de webhook secret:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### Opción 2: Configurar en el Dashboard de Kapso

1. **Accede al Dashboard de Kapso**
   - Ve a: https://app.kapso.com (o la URL de tu dashboard)
   - Inicia sesión con tu cuenta

2. **Navega a la Sección de Webhooks**
   - En el menú lateral, busca "Webhooks" o "Integraciones"
   - Click en "Webhooks" o "Webhook Configuration"

3. **Busca o Genera el Secret**
   - Puede estar en una sección llamada:
     - "Webhook Secret"
     - "Signing Secret"
     - "Verification Token"
     - "Security Token"
   
   - Si hay un botón "Generate Secret" o "Regenerate", úsalo
   - Si no existe, puedes crear uno tú mismo (ver Opción 1)

4. **Copia el Secret**
   - Copia el valor generado
   - Guárdalo de forma segura

5. **Configura en tu Proyecto**
   - Pega el secret en `.env.local`:
   ```env
   KAPSO_WEBHOOK_SECRET=tu_secret_aqui
   ```

### Opción 3: Si Kapso No Requiere Secret

Algunos servicios no requieren un webhook secret. En ese caso:

1. **Genera uno tú mismo** usando los métodos de la Opción 1
2. **Configúralo en tu `.env.local`**
3. **Cuando registres el webhook en Kapso**, incluye este secret en la configuración

## 📋 Configuración Actual

Tu archivo `.env.local` debe verse así:

```env
# Kapso API Configuration
KAPSO_API_KEY=313d6d1a72ba70c5187d1fb6a1a1555cc52bd203f5f90780d805ec114fc95e37
KAPSO_WEBHOOK_SECRET=tu_secret_generado_aqui
KAPSO_API_URL=https://api.kapso.com

# OpenRouter Configuration
OPENROUTER_API_KEY=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

# Application Configuration
NODE_ENV=development
```

## 🔄 Proceso Completo de Configuración del Webhook

### Paso 1: Generar el Secret
```bash
# En tu terminal, ejecuta:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Esto generará algo como:
```
7f3a9b2c8d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9
```

### Paso 2: Actualizar .env.local
```env
KAPSO_WEBHOOK_SECRET=7f3a9b2c8d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9
```

### Paso 3: Desplegar a Vercel
```bash
cd whatsapp-chatbot
vercel --prod
```

### Paso 4: Configurar en Kapso Dashboard

1. Ve al Dashboard de Kapso
2. Navega a Webhooks
3. Click en "Add Webhook" o "New Webhook"
4. Completa el formulario:

```
Webhook URL: https://tu-proyecto.vercel.app/api/webhook/whatsapp
Method: POST
Secret/Token: 7f3a9b2c8d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9
Events: 
  ✅ message.received
  ✅ message.sent
  ✅ message.delivered
  ✅ message.read
```

5. Click en "Save" o "Create Webhook"

### Paso 5: Verificar el Webhook

Kapso enviará una solicitud de verificación a tu endpoint. Si todo está bien configurado:
- ✅ Verás un estado "Active" o "Verified"
- ✅ Los mensajes comenzarán a llegar a tu webhook

## 🔍 Verificar la Configuración

### Probar localmente (opcional)

1. **Instalar ngrok** (para exponer tu localhost):
```bash
npm install -g ngrok
```

2. **Ejecutar tu proyecto**:
```bash
npm run dev
```

3. **Exponer con ngrok**:
```bash
ngrok http 3000
```

4. **Usar la URL de ngrok** en Kapso temporalmente:
```
https://abc123.ngrok.io/api/webhook/whatsapp
```

## 🆘 Troubleshooting

### Error: "Invalid signature" o "Unauthorized"

**Causa**: El webhook secret no coincide

**Solución**:
1. Verifica que el secret en `.env.local` sea exactamente el mismo que en Kapso
2. No debe tener espacios extra al inicio o final
3. Asegúrate de hacer redeploy después de cambiar variables de entorno

### Error: "Webhook verification failed"

**Causa**: El endpoint no responde correctamente

**Solución**:
1. Verifica que tu proyecto esté desplegado en Vercel
2. Prueba acceder a: `https://tu-proyecto.vercel.app/api/webhook/whatsapp`
3. Revisa los logs de Vercel para errores

### No recibo mensajes

**Causa**: El webhook no está registrado correctamente

**Solución**:
1. Verifica que el webhook esté "Active" en Kapso
2. Asegúrate de haber seleccionado los eventos correctos
3. Prueba enviar un mensaje de prueba desde WhatsApp
4. Revisa los logs en Vercel Dashboard

## 📝 Notas Importantes

- ⚠️ **Nunca compartas tu webhook secret públicamente**
- ⚠️ **No lo subas a GitHub** (ya está en .gitignore)
- ⚠️ **Usa el mismo secret en .env.local y en Kapso**
- ⚠️ **Regenera el secret si crees que fue comprometido**

## ✅ Checklist

- [ ] Generar webhook secret seguro
- [ ] Actualizar `.env.local` con el secret
- [ ] Desplegar proyecto a Vercel
- [ ] Configurar variables de entorno en Vercel
- [ ] Registrar webhook en Kapso Dashboard
- [ ] Verificar que el webhook esté activo
- [ ] Probar enviando un mensaje de WhatsApp

## 🎯 Siguiente Paso

Una vez que tengas el webhook secret configurado, estarás listo para:
1. Desplegar a Vercel
2. Registrar el webhook en Kapso
3. ¡Probar tu chatbot!

¿Necesitas ayuda con algún paso específico?