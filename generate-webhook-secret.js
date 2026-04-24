#!/usr/bin/env node

const crypto = require('crypto');

// Generar un webhook secret seguro
const secret = crypto.randomBytes(32).toString('hex');

console.log('\n🔐 Webhook Secret Generado:\n');
console.log(secret);
console.log('\n📋 Copia este valor y úsalo para:');
console.log('1. Actualizar .env.local: KAPSO_WEBHOOK_SECRET=' + secret);
console.log('2. Configurar en Cloudflare: npx wrangler secret put KAPSO_WEBHOOK_SECRET');
console.log('3. Registrar en Kapso Dashboard cuando configures el webhook\n');

// Made with Bob
