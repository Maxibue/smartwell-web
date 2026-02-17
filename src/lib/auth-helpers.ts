// Utilidades para validar roles de usuario en el backend (API routes)
import { getAdmin } from './firebase-admin';

/**
 * Verifica que un usuario tenga el rol de administrador
 * 
 * @param uid - ID del usuario a verificar
 * @returns Promise<boolean> - true si es admin, false si no
 */
export async function verifyAdminRole(uid: string): Promise<boolean> {
    try {
        const admin = getAdmin();
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(uid)
            .get();

        if (!userDoc.exists) {
            return false;
        }

        const userData = userDoc.data();
        return userData?.role === 'admin';
    } catch (error) {
        console.error('Error verifying admin role:', error);
        return false;
    }
}

/**
 * Verifica que un usuario tenga el rol de profesional
 */
export async function verifyProfessionalRole(uid: string): Promise<boolean> {
    try {
        const admin = getAdmin();
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(uid)
            .get();

        if (!userDoc.exists) {
            return false;
        }

        const userData = userDoc.data();
        return userData?.role === 'professional';
    } catch (error) {
        console.error('Error verifying professional role:', error);
        return false;
    }
}

/**
 * Verifica que el token de autenticación es válido y obtiene el UID
 * 
 * @param authHeader - Header de autorización (Bearer token)
 * @returns Promise<string | null> - UID del usuario o null si el token es inválido
 */
export async function verifyAuthToken(authHeader: string | null): Promise<string | null> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);

    try {
        const admin = getAdmin();
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken.uid;
    } catch (error) {
        console.error('Error verifying auth token:', error);
        return null;
    }
}

/**
 * Middleware para verificar que el usuario es administrador
 * Uso en API routes:
 * 
 * const uid = await requireAdmin(request);
 * if (!uid) {
 *     return new Response('Unauthorized', { status: 401 });
 * }
 */
export async function requireAdmin(request: Request): Promise<string | null> {
    const authHeader = request.headers.get('authorization');
    const uid = await verifyAuthToken(authHeader);

    if (!uid) {
        return null;
    }

    const isAdmin = await verifyAdminRole(uid);
    if (!isAdmin) {
        return null;
    }

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
