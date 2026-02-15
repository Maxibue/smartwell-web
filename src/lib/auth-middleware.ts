import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from './firebase-admin';

export interface AuthenticatedRequest extends NextRequest {
    user?: {
        uid: string;
        email?: string;
        role?: string;
    };
}

/**
 * Middleware para verificar autenticación en API routes
 * Extrae y verifica el token JWT de Firebase del header Authorization
 */
export async function verifyAuth(request: NextRequest): Promise<{
    authenticated: boolean;
    user?: {
        uid: string;
        email?: string;
        role?: string;
    };
    error?: string;
}> {
    try {
        // Obtener el token del header Authorization
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                authenticated: false,
                error: 'Missing or invalid authorization header'
            };
        }

        // Extraer el token
        const token = authHeader.split('Bearer ')[1];

        if (!token) {
            return {
                authenticated: false,
                error: 'No token provided'
            };
        }

        // Verificar el token con Firebase Admin
        const decodedToken = await adminAuth.verifyIdToken(token);

        return {
            authenticated: true,
            user: {
                uid: decodedToken.uid,
                email: decodedToken.email,
                role: decodedToken.role as string | undefined,
            }
        };
    } catch (error: any) {
        console.error('Auth verification error:', error);
        return {
            authenticated: false,
            error: error.message || 'Invalid token'
        };
    }
}

/**
 * Middleware para verificar que el usuario es administrador
 */
export async function verifyAdmin(request: NextRequest): Promise<{
    authenticated: boolean;
    isAdmin: boolean;
    user?: {
        uid: string;
        email?: string;
        role?: string;
    };
    error?: string;
}> {
    const authResult = await verifyAuth(request);

    if (!authResult.authenticated) {
        return {
            authenticated: false,
            isAdmin: false,
            error: authResult.error
        };
    }

    const isAdmin = authResult.user?.role === 'admin';

    return {
        authenticated: true,
        isAdmin,
        user: authResult.user,
        error: isAdmin ? undefined : 'Insufficient permissions'
    };
}

/**
 * Helper para crear respuestas de error de autenticación
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
    return NextResponse.json(
        { error: message },
        { status: 401 }
    );
}

/**
 * Helper para crear respuestas de error de permisos
 */
export function forbiddenResponse(message: string = 'Forbidden') {
    return NextResponse.json(
        { error: message },
        { status: 403 }
    );
}
