# WhatsApp Chatbot con IA - Kapso + Vercel AI SDK

Chatbot inteligente de WhatsApp que utiliza la API de Kapso para la mensajería y Vercel AI SDK para respuestas con inteligencia artificial.

## 🚀 Características

- ✅ Integración con WhatsApp vía Kapso API
- ✅ Respuestas inteligentes con IA (OpenAI GPT-4)
- ✅ Manejo de contexto de conversación
- ✅ Indicadores de escritura
- ✅ Marcado de mensajes como leídos
- ✅ Verificación de webhooks para seguridad
- ✅ Desplegable en Vercel con un click

## 📋 Requisitos Previos

Antes de comenzar, necesitas obtener las siguientes credenciales:

### 1. **Cuenta de Kapso**
- Regístrate en [Kapso](https://kapso.com)
- Obtén tu `KAPSO_API_KEY` desde el dashboard
- Genera un `KAPSO_WEBHOOK_SECRET` para seguridad

### 2. **API Key de OpenAI**
- Crea una cuenta en [OpenAI](https://platform.openai.com)
- Genera una API key desde la sección de API keys
- Asegúrate de tener créditos disponibles

### 3. **Cuenta de Vercel** (para deployment)
- Regístrate en [Vercel](https://vercel.com)
- Conecta tu repositorio de GitHub

## 🛠️ Instalación Local

1. **Clonar el repositorio**
```bash
cd whatsapp-chatbot
npm install
```

2. **Configurar variables de entorno**

Copia el archivo `.env.local` y completa con tus credenciales:

```env
# Kapso API Configuration
KAPSO_API_KEY=tu_api_key_de_kapso
KAPSO_WEBHOOK_SECRET=tu_secret_de_webhook
KAPSO_API_URL=https://api.kapso.com

# OpenAI Configuration
OPENAI_API_KEY=tu_api_key_de_openai
```

3. **Ejecutar en desarrollo**
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## 🌐 Deployment en Vercel

### Opción 1: Deploy desde GitHub

1. **Push tu código a GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Conectar con Vercel**
- Ve a [Vercel Dashboard](https://vercel.com/dashboard)
- Click en "Add New Project"
- Importa tu repositorio de GitHub
- Configura las variables de entorno en Vercel:
  - `KAPSO_API_KEY`
  - `KAPSO_WEBHOOK_SECRET`
  - `KAPSO_API_URL`
  - `OPENAI_API_KEY`

3. **Deploy**
- Click en "Deploy"
- Espera a que termine el deployment
- Copia la URL de tu proyecto (ej: `https://tu-proyecto.vercel.app`)

### Opción 2: Deploy con Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

## 🔗 Configurar Webhook en Kapso

Una vez desplegado en Vercel:

1. Ve al dashboard de Kapso
2. Navega a la sección de Webhooks
3. Agrega una nueva URL de webhook:
   ```
   https://tu-proyecto.vercel.app/api/webhook/whatsapp
   ```
4. Selecciona los eventos que quieres recibir:
   - `message.received`
   - `message.sent`
   - `message.delivered`
   - `message.read`

5. Guarda la configuración

## 📱 Probar el Chatbot

1. Envía un mensaje de WhatsApp al número configurado en Kapso
2. El chatbot debería responder automáticamente con IA
3. Revisa los logs en Vercel Dashboard para debugging

## 🔧 Estructura del Proyecto

```
whatsapp-chatbot/
├── app/
│   └── api/
│       └── webhook/
│           └── whatsapp/
│               └── route.ts          # Webhook endpoint
├── lib/
│   ├── kapso.ts                      # Cliente de Kapso API
│   └── ai.ts                         # Integración con Vercel AI SDK
├── .env.local                        # Variables de entorno (local)
├── package.json
└── README.md
```

## 🎯 Personalización

### Cambiar el Prompt del Sistema

Edita el archivo `lib/ai.ts` y modifica el `systemPrompt`:

```typescript
systemPrompt: 'Tu prompt personalizado aquí'
```

### Agregar Más Proveedores de IA

El proyecto usa Vercel AI SDK, que soporta múltiples proveedores:

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

// Usar Anthropic Claude
model: anthropic('claude-3-5-sonnet-20241022')

// Usar Google Gemini
model: google('gemini-1.5-pro')
```

### Implementar Base de Datos para Historial

Para producción, reemplaza el `Map` en memoria con una base de datos:

- **Vercel KV** (Redis)
- **Upstash Redis**
- **MongoDB**
- **PostgreSQL**

## 📊 Monitoreo y Logs

### Ver logs en Vercel
```bash
vercel logs
```

### Logs en tiempo real
```bash
vercel logs --follow
```

## 🐛 Troubleshooting

### El webhook no recibe mensajes
- Verifica que la URL del webhook esté correctamente configurada en Kapso
- Asegúrate de que el `KAPSO_WEBHOOK_SECRET` coincida
- Revisa los logs de Vercel para errores

### Errores de IA
- Verifica que tu `OPENAI_API_KEY` sea válida
- Confirma que tienes créditos disponibles en OpenAI
- Revisa los límites de rate limiting

### Errores de deployment
- Asegúrate de que todas las variables de entorno estén configuradas
- Verifica que las dependencias estén correctamente instaladas
- Revisa los logs de build en Vercel

## 📝 Próximos Pasos

- [ ] Implementar base de datos para historial persistente
- [ ] Agregar rate limiting por usuario
- [ ] Implementar comandos especiales (/help, /reset, etc.)
- [ ] Agregar soporte para imágenes y documentos
- [ ] Implementar analytics y métricas
- [ ] Agregar tests unitarios e integración

## 📄 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## 📧 Soporte

Para soporte, contacta a través de:
- Email: tu-email@ejemplo.com
- GitHub Issues: [Crear Issue](https://github.com/tu-usuario/whatsapp-chatbot/issues)
