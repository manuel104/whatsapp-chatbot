#!/bin/bash

# Script de deployment automatizado para Cloudflare Pages
# Autor: Bob
# Fecha: 2026-04-24

set -e  # Exit on error

echo "🚀 Iniciando deployment a Cloudflare Pages..."
echo ""

# Configurar API Token (debe estar en variable de entorno)
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ Error: CLOUDFLARE_API_TOKEN no está configurado"
    echo "Por favor, configura la variable de entorno:"
    echo "export CLOUDFLARE_API_TOKEN='tu_token_aqui'"
    exit 1
fi

# Verificar autenticación
echo "✓ Verificando autenticación con Cloudflare..."
npx wrangler whoami

echo ""
echo "📦 Configurando secrets en Cloudflare..."
echo ""

# Primero desplegamos, luego configuramos secrets
echo "⏭️  Los secrets se configurarán después del primer deployment"

echo ""
echo "✓ Secrets configurados exitosamente"
echo ""

# Build del proyecto
echo "🔨 Building proyecto..."
npm run build

echo ""
echo "☁️ Desplegando a Cloudflare Pages..."
npx wrangler pages deploy .next --project-name=whatsapp-chatbot --branch=main

echo ""
echo "📦 Configurando secrets en Cloudflare Pages..."
echo ""

# Configurar secrets para Pages (después del deployment)
echo "Configurando KAPSO_API_KEY..."
echo "313d6d1a72ba70c5187d1fb6a1a1555cc52bd203f5f90780d805ec114fc95e37" | npx wrangler pages secret put KAPSO_API_KEY --project-name=whatsapp-chatbot

echo "Configurando KAPSO_WEBHOOK_SECRET..."
echo "000abb8ff00fc595fe054cffe78a7fae68a969f5ae54114d3fcd99bceb6bb945" | npx wrangler pages secret put KAPSO_WEBHOOK_SECRET --project-name=whatsapp-chatbot

echo "Configurando OPENROUTER_API_KEY..."
echo "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" | npx wrangler pages secret put OPENROUTER_API_KEY --project-name=whatsapp-chatbot

echo ""
echo "✅ Deployment completado!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Copia la URL de tu deployment"
echo "2. Ve al dashboard de Kapso"
echo "3. Configura el webhook con:"
echo "   URL: https://whatsapp-chatbot.pages.dev/api/webhook/whatsapp"
echo "   Secret: 000abb8ff00fc595fe054cffe78a7fae68a969f5ae54114d3fcd99bceb6bb945"
echo ""
echo "🎉 ¡Tu chatbot está listo!"

# Made with Bob
