import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminAuthInstance: Auth | null = null;
let adminFirestoreInstance: Firestore | null = null;
let initializationFailed = false;

/**
 * Inicializa Firebase Admin SDK de forma lazy (solo cuando se necesita)
 * Esto previene errores durante el build de Next.js
 * RETORNA NULL si falla la inicialización (para permitir fallbacks)
 */
function initializeAdminApp(): App | null {
    // Si ya falló antes, no reintentar
    if (initializationFailed) {
        return null;
    }

    if (adminApp) {
        return adminApp;
    }

    // Verificar si ya hay apps inicializadas
    const existingApps = getApps();
    if (existingApps.length > 0) {
        adminApp = existingApps[0];
        return adminApp;
    }

    try {
        // Configuración del Service Account
        let credential;

        // Opción 1: Archivo JSON local (para desarrollo)
        try {
            const fs = require('fs');
            const path = require('path');

            // Intentar varios nombres de archivo posibles
            const possiblePaths = [
                path.join(process.cwd(), 'serviceAccountKey.json'),
                path.join(process.cwd(), 'smartwell-v2-firebase-adminsdk-fbsvc-240ff888bf.json'),
                path.join(process.cwd(), 'smartwell-v2-6ba2c4e6329f.json'),
            ];

            let serviceAccountPath = null;
            for (const filePath of possiblePaths) {
                if (fs.existsSync(filePath)) {
                    serviceAccountPath = filePath;
                    break;
                }
            }

            if (serviceAccountPath) {
                const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                credential = cert(serviceAccount);
                console.log('✅ Firebase Admin SDK using local service account file');
            }
        } catch (fileError) {
            // Si falla lectura de archivo, continuar con otras opciones
            console.log('ℹ️ No local service account file found, trying environment variables...');
        }

        // Opción 2: Variable de entorno con JSON completo
        if (!credential && process.env.FIREBASE_SERVICE_ACCOUNT) {
            try {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                credential = cert(serviceAccount);
                console.log('✅ Firebase Admin SDK using FIREBASE_SERVICE_ACCOUNT env var');
            } catch (error) {
                console.warn('⚠️ Error parsing FIREBASE_SERVICE_ACCOUNT. Trying individual vars...');
            }
        }

        // Opción 3: Variables individuales (recomendado para Vercel)
        if (!credential && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            console.log('🟡 Attempting to use individual environment variables...');
            console.log('🟡 FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
            console.log('🟡 FIREBASE_PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY.length);

            // Procesar la private key - Vercel puede escapar de diferentes maneras
            let privateKey = process.env.FIREBASE_PRIVATE_KEY;

            // Intentar ambos formatos de escapado
            privateKey = privateKey.replace(/\n/g, '\n').replace(/\\n/g, '\n');

            credential = cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            });
            console.log('✅ Firebase Admin SDK using individual environment variables');
        }

        // Si no hay credenciales disponibles, retornar null
        if (!credential) {
            console.warn('⚠️ No Firebase Admin credentials found. Admin SDK disabled. Using fallback methods.');
            initializationFailed = true;
            return null;
        }

        adminApp = initializeApp({
            credential,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });

        console.log('✅ Firebase Admin SDK initialized successfully');
        return adminApp;
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin SDK:', error);
        initializationFailed = true;
        return null;
    }
}

/**
 * Obtiene la instancia de Auth de Firebase Admin
 * Lazy loading para prevenir errores en build time
 * LANZA ERROR si no está disponible (para que auth-helpers use fallback)
 */
export function getAdminAuth(): Auth {
    if (!adminAuthInstance) {
        const app = initializeAdminApp();
        if (!app) {
            throw new Error('Firebase Admin SDK not available - credentials missing');
        }
        adminAuthInstance = getAuth(app);
    }
    return adminAuthInstance;
}

// Export para compatibilidad
export const adminAuth = {
    verifyIdToken: async (token: string) => {
        const auth = getAdminAuth();
        return auth.verifyIdToken(token);
    }
};

/**
 * Obtiene la instancia de Firestore de Firebase Admin
 * Lazy loading para prevenir errores en build time
 * LANZA ERROR si no está disponible (para que auth-helpers use fallback)
 */
export function getAdminDb(): Firestore {
    if (!adminFirestoreInstance) {
        const app = initializeAdminApp();
        if (!app) {
            throw new Error('Firebase Admin SDK not available - credentials missing');
        }
        adminFirestoreInstance = getFirestore(app);
    }
    return adminFirestoreInstance;
}

export { adminApp };
