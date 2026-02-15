import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App;

// Initialize Firebase Admin SDK
if (!getApps().length) {
    // En producción, Vercel usa las credenciales de la variable de entorno
    // En desarrollo, puedes usar un service account JSON
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : {
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            // Para desarrollo, Firebase Admin puede usar Application Default Credentials
        };

    adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
} else {
    adminApp = getApps()[0];
}

export const adminAuth = getAuth(adminApp);
export { adminApp };
