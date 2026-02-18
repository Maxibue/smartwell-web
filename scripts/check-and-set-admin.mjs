/**
 * Script para verificar y actualizar el rol de un usuario a administrador
 * Ejecutar con: node check-and-set-admin.mjs YOUR_EMAIL
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Configurar Firebase Admin
const app = initializeApp({
    projectId: 'smartwell-v2'
});

const db = getFirestore(app);
const auth = getAuth(app);

async function checkAndSetAdmin(email) {
    try {
        console.log('🔍 Buscando usuario con email:', email);

        // 1. Obtener el usuario por email
        const userRecord = await auth.getUserByEmail(email);
        const uid = userRecord.uid;

        console.log('✅ Usuario encontrado!');
        console.log('   UID:', uid);
        console.log('   Email:', userRecord.email);
        console.log('   Email verificado:', userRecord.emailVerified);

        // 2. Verificar el documento en Firestore
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            console.log('❌ El documento del usuario no existe en Firestore');
            console.log('   Creando documento de usuario...');

            await db.collection('users').doc(uid).set({
                email: userRecord.email,
                role: 'admin',
                name: userRecord.displayName || 'Admin',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log('✅ Documento de usuario creado con rol admin');
        } else {
            const userData = userDoc.data();
            console.log('✅ Documento encontrado en Firestore');
            console.log('   Rol actual:', userData.role || 'sin rol');
            console.log('   Nombre:', userData.name || 'sin nombre');

            if (userData.role !== 'admin') {
                console.log('⚠️  El usuario NO es admin');
                console.log('   Actualizando rol a admin...');

                await db.collection('users').doc(uid).update({
                    role: 'admin',
                    updatedAt: new Date()
                });

                console.log('✅ Rol actualizado a admin');
            } else {
                console.log('✅ El usuario ya es admin');
            }
        }

        // 3. Verificar nuevamente
        const updatedDoc = await db.collection('users').doc(uid).get();
        const finalData = updatedDoc.data();

        console.log('\n📊 Estado final del usuario:');
        console.log('   Email:', finalData.email);
        console.log('   Rol:', finalData.role);
        console.log('   Nombre:', finalData.name);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Obtener email de argumentos de línea de comandos
const email = process.argv[2];

if (!email) {
    console.error('❌ Debes proporcionar un email como argumento');
    console.log('Uso: node check-and-set-admin.mjs YOUR_EMAIL');
    process.exit(1);
}

checkAndSetAdmin(email)
    .then(() => {
        console.log('\n✅ Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error inesperado:', error);
        process.exit(1);
    });
