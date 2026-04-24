# 🚀 Guía de Configuración Paso a Paso

Esta guía te llevará a través del proceso completo de configuración del chatbot de WhatsApp.

## 📋 Checklist de Credenciales Necesarias

Antes de comenzar, asegúrate de tener:

- [ ] Cuenta de Kapso con API key
- [ ] Webhook secret de Kapso
- [ ] API key de OpenAI
- [ ] Cuenta de Vercel (para deployment)
- [ ] Repositorio de GitHub (opcional pero recomendado)

---

## 1️⃣ Configurar Kapso

### Paso 1: Crear cuenta en Kapso
1. Ve a [https://kapso.com](https://kapso.com)
2. Regístrate o inicia sesión
3. Completa el proceso de verificación

### Paso 2: Obtener API Key
1. Ve al Dashboard de Kapso
2. Navega a **Settings** → **API Keys**
3. Click en **"Generate New API Key"**
4. Copia y guarda tu `KAPSO_API_KEY`
5. ⚠️ **Importante**: Guarda esta key de forma segura, no la compartas

### Paso 3: Generar Webhook Secret
1. En el Dashboard de Kapso, ve a **Webhooks**
2. Click en **"Generate Secret"**
3. Copia y guarda tu `KAPSO_WEBHOOK_SECRET`

### Paso 4: Conectar número de WhatsApp
1. En Kapso, ve a **WhatsApp** → **Connect Number**
2. Sigue las instrucciones para conectar tu número de WhatsApp Business
3. Verifica que el número esté activo

---

## 2️⃣ Configurar OpenAI

### Paso 1: Crear cuenta en OpenAI
1. Ve a [https://platform.openai.com](https://platform.openai.com)
2. Regístrate o inicia sesión
3. Completa la verificación de tu cuenta

### Paso 2: Agregar método de pago
1. Ve a **Settings** → **Billing**
2. Agrega un método de pago válido
3. Considera agregar un límite de gasto mensual

### Paso 3: Generar API Key
1. Ve a **API Keys** en el menú lateral
2. Click en **"Create new secret key"**
3. Dale un nombre descriptivo (ej: "WhatsApp Chatbot")
4. Copia y guarda tu `OPENAI_API_KEY`
5. ⚠️ **Importante**: Esta key solo se muestra una vez

---

## 3️⃣ Configurar el Proyecto Localmente

### Paso 1: Clonar y configurar
```bash
cd whatsapp-chatbot
npm install
```

### Paso 2: Configurar variables de entorno
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:
```env
KAPSO_API_KEY=tu_api_key_aqui
KAPSO_WEBHOOK_SECRET=tu_secret_aqui
KAPSO_API_URL=https://api.kapso.com
OPENAI_API_KEY=tu_openai_key_aqui
```

### Paso 3: Probar localmente
```bash
npm run dev
```

Visita `http://localhost:3000` para verificar que funciona.

---

## 4️⃣ Deployment en Vercel

### Opción A: Deploy desde GitHub (Recomendado)

#### Paso 1: Subir código a GitHub
```bash
git init
git add .
git commit -m "Initial commit: WhatsApp chatbot"
git branch -M main
git remote add origin https://github.com/tu-usuario/whatsapp-chatbot.git
git push -u origin main
```

#### Paso 2: Conectar con Vercel
1. Ve a [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Click en **"Add New Project"**
3. Click en **"Import Git Repository"**
4. Selecciona tu repositorio de GitHub
5. Click en **"Import"**

#### Paso 3: Configurar variables de entorno en Vercel
1. En la página de configuración del proyecto, ve a **"Environment Variables"**
2. Agrega las siguientes variables:

| Name | Value |
|------|-------|
| `KAPSO_API_KEY` | Tu API key de Kapso |
| `KAPSO_WEBHOOK_SECRET` | Tu webhook secret |
| `KAPSO_API_URL` | `https://api.kapso.com` |
| `OPENAI_API_KEY` | Tu API key de OpenAI |

3. Asegúrate de seleccionar **Production**, **Preview**, y **Development**

#### Paso 4: Deploy
1. Click en **"Deploy"**
2. Espera a que termine el build (2-3 minutos)
3. Una vez completado, copia la URL de tu proyecto
   - Ejemplo: `https://whatsapp-chatbot-abc123.vercel.app`

### Opción B: Deploy con Vercel CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Configurar variables de entorno
vercel env add KAPSO_API_KEY
vercel env add KAPSO_WEBHOOK_SECRET
vercel env add KAPSO_API_URL
vercel env add OPENAI_API_KEY
```

---

## 5️⃣ Configurar Webhook en Kapso

### Paso 1: Obtener URL del webhook
Tu URL de webhook será:
```
https://tu-proyecto.vercel.app/api/webhook/whatsapp
```

### Paso 2: Registrar webhook en Kapso
1. Ve al Dashboard de Kapso
2. Navega a **Webhooks** → **Add Webhook**
3. Ingresa la URL del webhook
4. Selecciona los eventos:
   - ✅ `message.received`
   - ✅ `message.sent`
   - ✅ `message.delivered`
   - ✅ `message.read`
5. Click en **"Save"**

### Paso 3: Verificar webhook
1. Kapso enviará una solicitud de verificación
2. Si todo está configurado correctamente, verás un ✅ verde
3. Si hay error, revisa los logs en Vercel

---

## 6️⃣ Probar el Chatbot

### Paso 1: Enviar mensaje de prueba
1. Desde tu teléfono, envía un mensaje de WhatsApp al número conectado en Kapso
2. Ejemplo: "Hola, ¿cómo estás?"

### Paso 2: Verificar respuesta
- El chatbot debería responder en 2-5 segundos
- Deberías ver el indicador de "escribiendo..."
- El mensaje debería marcarse como "leído"

### Paso 3: Revisar logs
Si algo no funciona, revisa los logs:

**En Vercel:**
```bash
vercel logs --follow
```

**O en el Dashboard:**
1. Ve a tu proyecto en Vercel
2. Click en **"Logs"**
3. Filtra por errores

---

## 🔧 Troubleshooting

### Problema: Webhook no recibe mensajes

**Solución:**
1. Verifica que la URL del webhook esté correcta
2. Asegúrate de que el proyecto esté desplegado en Vercel
3. Revisa que el `KAPSO_WEBHOOK_SECRET` coincida
4. Verifica los logs de Vercel para errores

### Problema: Error de OpenAI API

**Solución:**
1. Verifica que tu `OPENAI_API_KEY` sea válida
2. Confirma que tienes créditos en tu cuenta de OpenAI
3. Revisa los límites de rate limiting
4. Intenta con un modelo diferente (ej: `gpt-3.5-turbo`)

### Problema: Respuestas lentas

**Solución:**
1. Considera usar `gpt-3.5-turbo` en lugar de `gpt-4`
2. Reduce el tamaño del historial de conversación
3. Implementa caché para respuestas comunes
4. Usa Edge Runtime en Vercel

### Problema: Variables de entorno no funcionan

**Solución:**
1. Verifica que las variables estén configuradas en Vercel
2. Asegúrate de hacer redeploy después de agregar variables
3. Verifica que no haya espacios extra en los valores
4. Usa comillas si los valores contienen caracteres especiales

---

## 📊 Monitoreo

### Ver logs en tiempo real
```bash
vercel logs --follow
```

### Ver logs de un deployment específico
```bash
vercel logs [deployment-url]
```

### Configurar alertas
1. Ve a tu proyecto en Vercel
2. Click en **"Settings"** → **"Notifications"**
3. Configura alertas para errores y downtime

---

## 🎯 Próximos Pasos

Una vez que todo funcione:

1. **Personaliza el prompt del sistema** en `lib/ai.ts`
2. **Implementa una base de datos** para historial persistente
3. **Agrega comandos especiales** (/help, /reset, etc.)
4. **Configura rate limiting** para evitar abuso
5. **Implementa analytics** para medir uso
6. **Agrega tests** para asegurar calidad

---

## 📞 Soporte

Si tienes problemas:

1. Revisa esta guía completa
2. Consulta el README.md
3. Revisa los logs de Vercel
4. Verifica la documentación de Kapso
5. Crea un issue en GitHub

---

## ✅ Checklist Final

Antes de considerar la configuración completa:

- [ ] Proyecto desplegado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Webhook registrado en Kapso
- [ ] Webhook verificado exitosamente
- [ ] Mensaje de prueba enviado y respondido
- [ ] Logs revisados sin errores
- [ ] Documentación leída y entendida

¡Felicidades! Tu chatbot de WhatsApp con IA está listo. 🎉