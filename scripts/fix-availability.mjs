// Script para corregir los slots de disponibilidad corruptos
// Ejecutar: node scripts/fix-availability.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBjgm4o9Lmkvksk1hFtpFSBI377E8TzTxs",
    authDomain: "smartwell-v2.firebaseapp.com",
    projectId: "smartwell-v2",
    storageBucket: "smartwell-v2.firebasestorage.app",
    messagingSenderId: "1011432492788",
    appId: "1:1011432492788:web:47c1d2d7ebf825e91718a1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PROFESSIONAL_ID = 'xTWO30AiF1hyzwCi4WCj5SRqOnH3';

console.log('Corrigiendo disponibilidad del profesional:', PROFESSIONAL_ID);

try {
    await updateDoc(doc(db, 'professionals', PROFESSIONAL_ID), {
        'availability.friday.slots': [
            { start: '09:00', end: '13:00' },
            { start: '14:00', end: '20:00' }
        ],
        'availability.wednesday.slots': [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '19:00' }
        ]
    });
    console.log('✅ Datos corregidos exitosamente!');
    console.log('  - Viernes: 09:00-13:00 y 14:00-20:00');
    console.log('  - Miércoles: 09:00-12:00 y 14:00-19:00');
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Código:', error.code);
}

process.exit(0);
