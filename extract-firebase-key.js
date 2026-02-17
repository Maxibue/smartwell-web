#!/usr/bin/env node

/**
 * Script para extraer la private_key de un archivo JSON de Firebase Service Account
 * 
 * Uso:
 *   1. Copia el contenido completo del archivo JSON de Firebase
 *   2. Pégalo cuando el script te lo pida
 *   3. El script extraerá la private_key automáticamente
 */

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n🔑 EXTRACTOR DE FIREBASE PRIVATE KEY\n');
console.log('Por favor, pega el contenido completo del archivo JSON de Firebase');
console.log('(Presiona Enter dos veces cuando termines)\n');

let jsonInput = '';
let emptyLineCount = 0;

rl.on('line', (line) => {
    if (line.trim() === '') {
        emptyLineCount++;
        if (emptyLineCount >= 2) {
            rl.close();
        }
    } else {
        emptyLineCount = 0;
        jsonInput += line + '\n';
    }
});

rl.on('close', () => {
    try {
        const serviceAccount = JSON.parse(jsonInput);

        if (!serviceAccount.private_key || !serviceAccount.client_email) {
            console.error('\n❌ Error: El JSON no contiene las credenciales esperadas');
            process.exit(1);
        }

        console.log('\n✅ Credenciales extraídas correctamente!\n');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📧 FIREBASE_CLIENT_EMAIL:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(serviceAccount.client_email);
        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔐 FIREBASE_PRIVATE_KEY:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(serviceAccount.private_key);
        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📋 INSTRUCCIONES PARA VERCEL:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('1. Ve a: https://vercel.com/maxibue-4045s-projects/smartwell-web/settings/environment-variables');
        console.log('2. Agrega estas dos variables:');
        console.log('   - Key: FIREBASE_CLIENT_EMAIL');
        console.log('     Value: ' + serviceAccount.client_email);
        console.log('   - Key: FIREBASE_PRIVATE_KEY');
        console.log('     Value: (copia el valor completo de arriba, incluyendo -----BEGIN y -----END)');
        console.log('3. Selecciona: Production, Preview, Development');
        console.log('4. Haz clic en "Save"');
        console.log('\n✅ Listo! Vercel hará un redeploy automático.\n');

    } catch (error) {
        console.error('\n❌ Error al parsear el JSON:', error.message);
        console.error('Por favor, asegúrate de pegar el JSON completo y válido.');
        process.exit(1);
    }
});
