// Utilidades para validar roles de usuario en el backend (API routes)
import { getAdminDb, getAdminAuth } from './firebase-admin';
import { db } from './firebase'; // Fallback client SDK
import { doc, getDoc } from 'firebase/firestore'; // Fallback client methods

const GOOGLE_IDENTITY_URL = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`;

/**
 * Fallback: Verifica token usando Google Identity Toolkit API REST
 * Útil cuando Admin SDK falla por credenciales locales inválidas
 */
async function verifyTokenRest(token: string): Promise<string | null> {
    try {
        const response = await fetch(GOOGLE_IDENTITY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: token })
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data.users[0].localId;
    } catch (e) {
        console.error("REST Auth check failed", e);
        return null;
    }
}

/**
 * Verifica que un usuario tenga el rol de administrador
 */
export async function verifyAdminRole(uid: string): Promise<boolean> {
    console.log('🔵 [AUTH] verifyAdminRole called for UID:', uid);

    try {
        // Intento 1: Admin SDK
        try {
            console.log('🟡 [AUTH] Trying Admin SDK for role check...');
            const dbAdmin = getAdminDb();
            const userDoc = await dbAdmin.collection('users').doc(uid).get();
            if (userDoc.exists) {
                const role = userDoc.data()?.role;
                console.log('🟡 [AUTH] Role from Admin SDK:', role);
                return role === 'admin';
            }
        } catch (adminError) {
            console.warn('⚠️ [AUTH] Admin SDK failed for role check, falling back to Firestore REST API:', adminError);
        }

        // Intento 2: Firestore REST API  
        // Las API routes no tienen contexto de autenticación del cliente,
        // por lo que no podemos usar el Client SDK. Usamos REST API en su lugar.
        console.log('🟡 [AUTH] Trying Firestore REST API for role check...');
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

        if (!projectId || !apiKey) {
            console.log('❌ [AUTH] Missing Firebase config');
            return false;
        }

        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}?key=${apiKey}`;

        const response = await fetch(firestoreUrl);

        if (!response.ok) {
            console.log('❌ [AUTH] Firestore REST API failed:', response.status, response.statusText);
            return false;
        }

        const data = await response.json();

        if (data.fields && data.fields.role && data.fields.role.stringValue) {
            const role = data.fields.role.stringValue;
            console.log('✅ [AUTH] Role from Firestore REST API:', role);
            return role === 'admin';
        }

        console.log('❌ [AUTH] User document not found or missing role field');
        return false;
    } catch (error) {
        console.error('❌ [AUTH] Error verifying admin role:', error);
        return false;
    }
}

/**
 * Verifica que un usuario tenga el rol de profesional
 */
export async function verifyProfessionalRole(uid: string): Promise<boolean> {
    try {
        // Intento 1: Admin SDK
        try {
            const dbAdmin = getAdminDb();
            const userDoc = await dbAdmin.collection('users').doc(uid).get();
            if (userDoc.exists) {
                return userDoc.data()?.role === 'professional';
            }
        } catch (adminError) {
            console.warn('Admin SDK failed for role check, falling back to Client SDK');
        }

        // Intento 2: Client SDK
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data()?.role === 'professional';
        }

        return false;
    } catch (error) {
        console.error('Error verifying professional role:', error);
        return false;
    }
}

/**
 * Verifica que el token de autenticación es válido y obtiene el UID
 */
export async function verifyAuthToken(authHeader: string | null): Promise<string | null> {
    console.log('🔵 [AUTH] verifyAuthToken called');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ [AUTH] Invalid or missing auth header');
        return null;
    }

    const token = authHeader.substring(7);
    console.log('🟡 [AUTH] Token extracted (first 20 chars):', token.substring(0, 20) + '...');

    try {
        // Intento 1: Admin SDK
        try {
            console.log('🟡 [AUTH] Trying Admin SDK for token verification...');
            const authAdmin = getAdminAuth();
            const decodedToken = await authAdmin.verifyIdToken(token);
            console.log('✅ [AUTH] Token verified via Admin SDK, UID:', decodedToken.uid);
            return decodedToken.uid;
        } catch (adminError) {
            console.warn('⚠️ [AUTH] Admin SDK auth check failed, trying REST API fallback...');
        }

        // Intento 2: REST API
        console.log('🟡 [AUTH] Trying REST API for token verification...');
        const uid = await verifyTokenRest(token);
        if (uid) {
            console.log('✅ [AUTH] Token verified via REST API, UID:', uid);
        } else {
            console.log('❌ [AUTH] REST API verification failed');
        }
        return uid;

    } catch (error) {
        console.error('❌ [AUTH] Error verifying auth token:', error);
        return null;
    }
}


/**
 * Middleware para verificar que el usuario es administrador
 */
export async function requireAdmin(request: Request): Promise<string | null> {
    console.log('🔵 [AUTH] requireAdmin called');

    const authHeader = request.headers.get('authorization');
    console.log('🟡 [AUTH] Authorization header:', authHeader ? 'present' : 'missing');

    const uid = await verifyAuthToken(authHeader);
    console.log('🟡 [AUTH] Verified UID:', uid || 'null');

    if (!uid) {
        console.log('❌ [AUTH] No UID - token verification failed');
        return null;
    }

    console.log('🟡 [AUTH] Checking admin role for UID:', uid);
    const isAdmin = await verifyAdminRole(uid);
    console.log('🟡 [AUTH] Is admin?', isAdmin);

    if (!isAdmin) {
        console.log('❌ [AUTH] User is not an admin');
        return null;
    }

    console.log('✅ [AUTH] Admin verification successful');
    return uid;
}

/**
 * Middleware para verificar que el usuario es profesional
 */
export async function requireProfessional(request: Request): Promise<string | null> {
    const authHeader = request.headers.get('authorization');
    const uid = await verifyAuthToken(authHeader);

    if (!uid) {
        return null;
    }

    const isProfessional = await verifyProfessionalRole(uid);
    if (!isProfessional) {
        return null;
    }

    return uid;
}

/**
 * Middleware para verificar que el usuario está autenticado (cualquier rol)
 */
export async function requireAuth(request: Request): Promise<string | null> {
    const authHeader = request.headers.get('authorization');
    return await verifyAuthToken(authHeader);
}
