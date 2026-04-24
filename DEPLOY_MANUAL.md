# 🚀 Deployment Manual en Cloudflare Pages (Dashboard)

El API token actual no tiene permisos suficientes para deployment automático. Aquí está la forma más sencilla de desplegar usando el dashboard de Cloudflare.

## 📋 Método 1: Deploy desde GitHub (Recomendado)

### Paso 1: Subir código a GitHub

```bash
cd whatsapp-chatbot

# Inicializar git si no está inicializado
git init

# Agregar todos los archivos
git add .

# Commit
git commit -m "Initial commit: WhatsApp Chatbot"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/TU_USUARIO/whatsapp-chatbot.git
git branch -M main
git push -u origin main
```

### Paso 2: Conectar con Cloudflare Pages

1. **Ve al Dashboard de Cloudflare**:
   - https://dash.cloudflare.com/4a165ea4835448826cb9b85c2b324bc3

2. **Navega a Workers & Pages**:
   - Click en "Workers & Pages" en el menú lateral

3. **Crear nuevo proyecto**:
   - Click en "Create application"
   - Selecciona "Pages"
   - Click en "Connect to Git"

4. **Conectar GitHub**:
   - Autoriza Cloudflare a acceder a GitHub
   - Selecciona el repositorio `whatsapp-chatbot`
   - Click en "Begin setup"

5. **Configurar el build**:
   ```
   Project name: whatsapp-chatbot
   Production branch: main
   Framework preset: Next.js
   Build command: npm run build
   Build output directory: .next
   ```

6. **Configurar variables de entorno**:
   
   Click en "Environment variables" y agrega:
   
   | Variable | Value |
   |----------|-------|
   | `KAPSO_API_KEY` | `313d6d1a72ba70c5187d1fb6a1a1555cc52bd203f5f90780d805ec114fc95e37` |
   | `KAPSO_WEBHOOK_SECRET` | `000abb8ff00fc595fe054cffe78a7fae68a969f5ae54114d3fcd99bceb6bb945` |
   | `KAPSO_API_URL` | `https://api.kapso.com` |
   | `OPENROUTER_API_KEY` | `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` |
   | `NODE_ENV` | `production` |

7. **Deploy**:
   - Click en "Save and Deploy"
   - Espera 2-3 minutos mientras se construye

8. **Obtener URL**:
   - Una vez completado, verás tu URL:
   - `https://whatsapp-chatbot.pages.dev`

---

## 📋 Método 2: Deploy Directo (Sin GitHub)

### Paso 1: Preparar el build

```bash
cd whatsapp-chatbot
npm run build
```

### Paso 2: Crear proyecto en Cloudflare

1. **Ve al Dashboard**:
   - https://dash.cloudflare.com/4a165ea4835448826cb9b85c2b324bc3

2. **Workers & Pages**:
   - Click en "Create application"
   - Selecciona "Pages"
   - Click en "Upload assets"

3. **Configurar proyecto**:
   ```
   Project name: whatsapp-chatbot
   ```

4. **Subir archivos**:
   - Arrastra la carpeta `.next` al área de upload
   - O click en "Select from computer" y selecciona `.next`

5. **Deploy**:
   - Click en "Deploy site"
   - Espera a que termine

### Paso 3: Configurar variables de entorno

1. **En el proyecto desplegado**:
   - Click en "Settings"
   - Click en "Environment variables"

2. **Agregar variables**:
   - Click en "Add variable"
   - Agrega cada una:
   
   ```
   KAPSO_API_KEY=313d6d1a72ba70c5187d1fb6a1a1555cc52bd203f5f90780d805ec114fc95e37
   KAPSO_WEBHOOK_SECRET=000abb8ff00fc595fe054cffe78a7fae68a969f5ae54114d3fcd99bceb6bb945
   KAPSO_API_URL=https://api.kapso.com
   OPENROUTER_API_KEY=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
   ```

3. **Redeploy**:
   - Click en "Deployments"
   - Click en "Retry deployment" en el último deployment

---

## 📋 Método 3: Usar Vercel (Alternativa Más Fácil)

Si Cloudflare sigue dando problemas, Vercel es más sencillo:

### Paso 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Paso 2: Login

```bash
vercel login
```

### Paso 3: Deploy

```bash
cd whatsapp-chatbot
vercel --prod
```

### Paso 4: Configurar variables

Durante el deploy, Vercel te preguntará por las variables de entorno. Ingresa:

```
KAPSO_API_KEY=313d6d1a72ba70c5187d1fb6a1a1555cc52bd203f5f90780d805ec114fc95e37
KAPSO_WEBHOOK_SECRET=000abb8ff00fc595fe054cffe78a7fae68a969f5ae54114d3fcd99bceb6bb945
KAPSO_API_URL=https://api.kapso.com
OPENROUTER_API_KEY=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
```

---

## 🔧 Después del Deployment

### 1. Obtener la URL

Tu proyecto estará disponible en:
- **Cloudflare**: `https://whatsapp-chatbot.pages.dev`
- **Vercel**: `https://whatsapp-chatbot-xxx.vercel.app`

### 2. Configurar Webhook en Kapso

1. Ve al dashboard de Kapso
2. Navega a Webhooks
3. Click en "Add Webhook"
4. Configura:

```
URL: https://TU-URL.pages.dev/api/webhook/whatsapp
Method: POST
Secret: 000abb8ff00fc595fe054cffe78a7fae68a969f5ae54114d3fcd99bceb6bb945
Events:
  ✅ message.received
  ✅ message.sent
  ✅ message.delivered
  ✅ message.read
```

5. Click en "Save"
6. Verifica que el webhook esté "Active" ✅

### 3. Probar el Chatbot

1. Envía un mensaje de WhatsApp al número conectado en Kapso
2. Deberías recibir una respuesta automática en 2-5 segundos
3. Si no funciona, revisa:
   - Logs en Cloudflare/Vercel Dashboard
   - Estado del webhook en Kapso
   - Variables de entorno configuradas

---

## 🆘 Troubleshooting

### Webhook no recibe mensajes

**Solución**:
1. Verifica que la URL del webhook sea correcta
2. Asegúrate de que el webhook esté "Active" en Kapso
3. Revisa los logs en el dashboard
4. Prueba el endpoint manualmente:
   ```bash
   curl https://TU-URL.pages.dev/api/webhook/whatsapp
   ```

### Error 500 en el webhook

**Solución**:
1. Verifica que todas las variables de entorno estén configuradas
2. Revisa los logs para ver el error específico
3. Asegúrate de que las API keys sean válidas

### Build falla

**Solución**:
```bash
# Limpiar y rebuild
rm -rf .next node_modules
npm install
npm run build
```

---

## ✅ Checklist Final

- [ ] Código subido a GitHub (Método 1) o build creado (Método 2)
- [ ] Proyecto creado en Cloudflare Pages o Vercel
- [ ] Variables de entorno configuradas
- [ ] Deployment exitoso
- [ ] URL del proyecto obtenida
- [ ] Webhook configurado en Kapso
- [ ] Webhook verificado (Active ✅)
- [ ] Mensaje de prueba enviado
- [ ] Respuesta recibida correctamente

---

## 💡 Recomendación

**Para este proyecto, recomiendo usar Vercel** porque:
- ✅ Más fácil de configurar
- ✅ Mejor soporte para Next.js
- ✅ CLI más simple
- ✅ Menos problemas con permisos
- ✅ Deploy en 1 comando

Cloudflare es excelente pero requiere más configuración inicial.

¿Prefieres que te ayude con Vercel en su lugar?