# 🗄️ Configuración de Base de Datos con Neon

Este proyecto usa **Neon** (PostgreSQL serverless) para almacenar conversaciones de forma persistente.

## 📋 Pasos para Configurar

### 1. Crear Cuenta en Neon

1. Ve a https://neon.tech
2. Crea una cuenta gratuita (con GitHub o email)
3. El plan gratuito incluye:
   - 0.5 GB de almacenamiento
   - 1 proyecto
   - Suficiente para miles de conversaciones

### 2. Crear Base de Datos

1. En el dashboard de Neon, haz clic en **"Create Project"**
2. Nombre del proyecto: `whatsapp-chatbot`
3. Región: Selecciona la más cercana (ej: US East)
4. PostgreSQL version: 16 (recomendado)
5. Haz clic en **"Create Project"**

### 3. Obtener Connection String

1. Una vez creado el proyecto, verás el **Connection String**
2. Copia la URL completa que se ve así:
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 4. Configurar en Vercel

#### Opción A: Desde Vercel Dashboard

1. Ve a https://vercel.com/tu-usuario/whatsapp-chatbot
2. Ve a **Settings** → **Environment Variables**
3. Agrega nueva variable:
   - **Name**: `DATABASE_URL`
   - **Value**: (pega el connection string de Neon)
   - **Environments**: Production, Preview, Development
4. Guarda los cambios

#### Opción B: Desde CLI

```bash
vercel env add DATABASE_URL
# Pega el connection string cuando te lo pida
# Selecciona: Production, Preview, Development
```

### 5. Configurar Localmente (Opcional)

Para desarrollo local, agrega a `.env.local`:

```bash
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 6. Redeploy

Después de agregar la variable de entorno:

```bash
cd whatsapp-chatbot
git commit --allow-empty -m "Trigger redeploy with database"
git push
```

O desde Vercel Dashboard:
- **Deployments** → **⋮** → **Redeploy**

## 🗃️ Estructura de la Base de Datos

El código creará automáticamente estas tablas en el primer uso:

### Tabla: `conversations`
```sql
- id (TEXT, PRIMARY KEY)
- phone_number (TEXT)
- started_at (TIMESTAMP)
- last_message_at (TIMESTAMP)
- message_count (INTEGER)
- is_active (BOOLEAN)
```

### Tabla: `messages`
```sql
- id (SERIAL, PRIMARY KEY)
- conversation_id (TEXT, FOREIGN KEY)
- phone_number (TEXT)
- role (TEXT: 'user' | 'assistant' | 'system')
- content (TEXT)
- created_at (TIMESTAMP)
```

## 🎯 Comandos Disponibles

Una vez configurada la base de datos, los usuarios pueden usar:

### `/nueva` o `/new`
Inicia una nueva conversación (cierra la actual y crea una nueva)

**Ejemplo:**
```
Usuario: /nueva
Bot: ✨ Nueva conversación iniciada. ¿En qué puedo ayudarte?
```

### `/historial` o `/history`
Muestra las últimas 10 conversaciones del usuario

**Ejemplo:**
```
Usuario: /historial
Bot: 📋 Tus conversaciones:

1. 24/04/2026 - 15 mensajes
2. 23/04/2026 - 8 mensajes
3. 22/04/2026 - 12 mensajes

💡 Escribe /nueva para iniciar una conversación nueva
```

### `/ayuda` o `/help`
Muestra la lista de comandos disponibles

## 🔍 Verificar Configuración

### Logs de Vercel

Después del redeploy, envía un mensaje de WhatsApp y verifica en los logs:

```
✅ Database initialized successfully
✅ Using conversation conv_573205293532_1776999025385 for 573205293532
✅ Sent response to 573205293532: ...
```

### Si Ves Errores

**Error: "DATABASE_URL is not defined"**
- Verifica que agregaste la variable en Vercel
- Haz redeploy después de agregar la variable

**Error: "Connection refused"**
- Verifica que el connection string sea correcto
- Asegúrate de incluir `?sslmode=require` al final

**Error: "Permission denied"**
- Verifica que el usuario tenga permisos de CREATE TABLE
- En Neon, el usuario por defecto tiene todos los permisos

## 📊 Monitoreo

### Dashboard de Neon

1. Ve a https://console.neon.tech
2. Selecciona tu proyecto
3. Ve a **"Monitoring"** para ver:
   - Queries ejecutados
   - Uso de almacenamiento
   - Conexiones activas

### Consultas SQL Directas

Puedes ejecutar queries directamente desde el dashboard de Neon:

```sql
-- Ver todas las conversaciones
SELECT * FROM conversations ORDER BY last_message_at DESC LIMIT 10;

-- Ver mensajes de una conversación
SELECT * FROM messages WHERE conversation_id = 'conv_xxx' ORDER BY created_at;

-- Estadísticas por usuario
SELECT 
  phone_number,
  COUNT(*) as total_conversations,
  SUM(message_count) as total_messages
FROM conversations
GROUP BY phone_number;
```

## 🚀 Beneficios de Usar Base de Datos

### ✅ Antes (En Memoria)
- ❌ Historial se pierde al reiniciar
- ❌ No hay persistencia entre deployments
- ❌ Limitado a una instancia de servidor

### ✅ Ahora (Con Neon)
- ✅ Historial persistente
- ✅ Funciona en múltiples instancias
- ✅ Usuarios pueden iniciar conversaciones nuevas
- ✅ Historial de conversaciones disponible
- ✅ Escalable y confiable

## 💡 Próximos Pasos

Una vez configurada la base de datos, puedes:

1. **Agregar más comandos** (ej: `/borrar`, `/exportar`)
2. **Implementar analytics** (mensajes por día, usuarios activos)
3. **Agregar límites** (ej: máximo de conversaciones por usuario)
4. **Exportar conversaciones** a CSV o JSON
5. **Implementar búsqueda** en el historial

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs de Vercel
2. Verifica el dashboard de Neon
3. Comprueba que `DATABASE_URL` esté configurada
4. Asegúrate de haber hecho redeploy después de agregar la variable

---

**¡Listo! Tu chatbot ahora tiene memoria persistente.** 🎉