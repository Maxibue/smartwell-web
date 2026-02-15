// Script para crear un usuario admin en Firestore
// Ejecutar con: node scripts/create-admin.js

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // Necesitarás descargar esto de Firebase Console

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createAdminUser(email) {
    try {
        // Buscar el usuario por email en Auth
        const userRecord = await admin.auth().getUserByEmail(email);
        const uid = userRecord.uid;

        // Actualizar el documento en Firestore
        await db.collection('users').doc(uid).update({
            role: 'admin'
        });

        console.log(`✅ Usuario ${email} actualizado a rol admin`);
        console.log(`UID: ${uid}`);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    process.exit();
}

// Cambiar este email por el que quieras hacer admin
const adminEmail = 'admin@gmail.com';
createAdminUser(adminEmail);
