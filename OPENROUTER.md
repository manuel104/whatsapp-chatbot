# 🤖 Guía de OpenRouter

OpenRouter es una plataforma que te da acceso unificado a múltiples modelos de IA a través de una sola API. Es perfecto para este proyecto porque puedes cambiar entre modelos fácilmente.

## 🌟 Ventajas de OpenRouter

- ✅ **Acceso a múltiples modelos**: GPT-4, Claude, Gemini, Llama, y más
- ✅ **Una sola API key**: No necesitas cuentas separadas
- ✅ **Precios competitivos**: A menudo más barato que usar APIs directas
- ✅ **Fallback automático**: Si un modelo falla, puede usar otro
- ✅ **Sin límites de rate**: Mejor disponibilidad

## 📊 Modelos Disponibles

### Recomendados para WhatsApp Chatbot

| Modelo | Velocidad | Costo | Calidad | Uso Recomendado |
|--------|-----------|-------|---------|-----------------|
| **openai/gpt-4o-mini** | ⚡⚡⚡ | 💰 | ⭐⭐⭐⭐ | **Mejor opción general** |
| **openai/gpt-4o** | ⚡⚡ | 💰💰💰 | ⭐⭐⭐⭐⭐ | Respuestas complejas |
| **anthropic/claude-3.5-sonnet** | ⚡⚡ | 💰💰 | ⭐⭐⭐⭐⭐ | Conversaciones largas |
| **google/gemini-pro-1.5** | ⚡⚡⚡ | 💰 | ⭐⭐⭐⭐ | Contexto muy largo |
| **meta-llama/llama-3.1-70b** | ⚡⚡ | 💰 | ⭐⭐⭐⭐ | Open source, privado |

### Modelos Especializados

- **openai/gpt-4-turbo**: Para análisis complejos
- **anthropic/claude-3-opus**: Máxima calidad
- **google/gemini-flash-1.5**: Ultra rápido
- **mistralai/mixtral-8x7b**: Económico y bueno

## 🔧 Configuración Actual

El proyecto está configurado para usar **openai/gpt-4o-mini** por defecto, que es:
- ⚡ Muy rápido (respuestas en 1-2 segundos)
- 💰 Económico (~$0.15 por 1M tokens de entrada)
- ⭐ Excelente calidad para conversaciones

## 🔄 Cambiar de Modelo

### Opción 1: Editar el código

En `lib/ai.ts`, cambia el modelo:

```typescript
// Usar GPT-4o (más potente)
model: openrouter('openai/gpt-4o')

// Usar Claude Sonnet (excelente razonamiento)
model: openrouter('anthropic/claude-3.5-sonnet')

// Usar Gemini Pro (contexto largo)
model: openrouter('google/gemini-pro-1.5')

// Usar Llama (open source)
model: openrouter('meta-llama/llama-3.1-70b-instruct')
```

### Opción 2: Variable de entorno

Agrega a `.env.local`:
```env
AI_MODEL=anthropic/claude-3.5-sonnet
```

Y modifica `lib/ai.ts`:
```typescript
model: openrouter(process.env.AI_MODEL || 'openai/gpt-4o-mini')
```

## 💡 Consejos de Uso

### Para Respuestas Rápidas
```typescript
model: openrouter('openai/gpt-4o-mini')
temperature: 0.7
```

### Para Conversaciones Complejas
```typescript
model: openrouter('anthropic/claude-3.5-sonnet')
temperature: 0.8
```

### Para Máxima Economía
```typescript
model: openrouter('meta-llama/llama-3.1-70b-instruct')
temperature: 0.7
```

### Para Contexto Muy Largo
```typescript
model: openrouter('google/gemini-pro-1.5')
temperature: 0.7
```

## 📈 Monitoreo de Uso

Puedes ver tu uso en el dashboard de OpenRouter:
1. Ve a [https://openrouter.ai/activity](https://openrouter.ai/activity)
2. Revisa costos por modelo
3. Configura alertas de presupuesto

## 🔐 Seguridad

Tu API key actual está configurada en `.env.local`:
```
OPENROUTER_API_KEY=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
```

⚠️ **Importante**: 
- No compartas esta key públicamente
- No la subas a GitHub (ya está en .gitignore)
- Configúrala como variable de entorno en Vercel

## 💰 Costos Estimados

Para un chatbot de WhatsApp con tráfico moderado:

**Escenario: 1000 mensajes/día**
- Entrada: ~500 tokens/mensaje = 500K tokens/día
- Salida: ~200 tokens/respuesta = 200K tokens/día

**Con GPT-4o-mini:**
- Entrada: $0.15/1M tokens = $0.075/día
- Salida: $0.60/1M tokens = $0.12/día
- **Total: ~$0.20/día = $6/mes**

**Con Claude Sonnet:**
- Entrada: $3/1M tokens = $1.50/día
- Salida: $15/1M tokens = $3/día
- **Total: ~$4.50/día = $135/mes**

## 🎯 Recomendación

Para este proyecto de WhatsApp chatbot, recomiendo:

1. **Desarrollo/Testing**: `openai/gpt-4o-mini` (rápido y barato)
2. **Producción básica**: `openai/gpt-4o-mini` (excelente balance)
3. **Producción premium**: `anthropic/claude-3.5-sonnet` (mejor calidad)
4. **Bajo presupuesto**: `meta-llama/llama-3.1-70b-instruct` (open source)

## 🔗 Enlaces Útiles

- [OpenRouter Dashboard](https://openrouter.ai/dashboard)
- [Lista de Modelos](https://openrouter.ai/models)
- [Precios](https://openrouter.ai/docs/pricing)
- [Documentación](https://openrouter.ai/docs)
- [API Keys](https://openrouter.ai/keys)

## 🆘 Troubleshooting

### Error: "Invalid API key"
- Verifica que la key esté correcta en `.env.local`
- Asegúrate de que la key tenga créditos

### Error: "Model not found"
- Verifica el nombre del modelo en [openrouter.ai/models](https://openrouter.ai/models)
- Usa el formato correcto: `provider/model-name`

### Respuestas lentas
- Cambia a un modelo más rápido (gpt-4o-mini, gemini-flash)
- Reduce el tamaño del contexto
- Considera usar streaming

### Costos altos
- Cambia a un modelo más económico
- Reduce el historial de conversación
- Implementa caché para respuestas comunes