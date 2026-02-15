import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App | null = null;
let adminAuthInstance: Auth | null = null;

/**
 * Inicializa Firebase Admin SDK de forma lazy (solo cuando se necesita)
 * Esto previene errores durante el build de Next.js
 */
function initializeAdminApp(): App {
    if (adminApp) {
        return adminApp;
    }

    // Verificar si ya hay apps inicializadas
    const existingApps = getApps();
    if (existingApps.length > 0) {
        adminApp = existingApps[0];
        return adminApp;
    }

    // Configuración del Service Account
    // En producción (Vercel), usar variables de entorno individuales
    // En desarrollo, puede usar FIREBASE_SERVICE_ACCOUNT JSON completo
    let credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Opción 1: JSON completo del service account
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            credential = cert(serviceAccount);
        } catch (error) {
            console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', error);
            throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT format');
        }
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        // Opción 2: Variables individuales (recomendado para Vercel)
        credential = cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Vercel escapa los saltos de línea, necesitamos reemplazarlos
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        });
    } else {
        // Opción 3: Application Default Credentials (para desarrollo local)
        // Firebase Admin intentará usar las credenciales del sistema
        console.warn('No Firebase Admin credentials found. Using Application Default Credentials.');
        // No especificamos credential, Firebase Admin usará ADC
        credential = undefined;
    }

    adminApp = initializeApp({
        credential,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });

    return adminApp;
}

/**
 * Obtiene la instancia de Auth de Firebase Admin
 * Lazy loading para prevenir errores en build time
 */
export function getAdminAuth(): Auth {
    if (!adminAuthInstance) {
        const app = initializeAdminApp();
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

export { adminApp };
