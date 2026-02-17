/**
 * Utilidad para hacer llamadas a API routes protegidas con autenticación Firebase
 */

import { User } from "firebase/auth";

interface APICallOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    headers?: Record<string, string>;
}

/**
 * Hace una llamada autenticada a una API route
 * Automáticamente incluye el token de Firebase Auth
 */
export async function callProtectedAPI(
    user: User,
    endpoint: string,
    options: APICallOptions = {}
): Promise<Response> {
    const { method = 'POST', body, headers = {} } = options;

    // Obtener token de autenticación
    const token = await user.getIdToken();

    // Configurar headers
    const finalHeaders: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...headers,
    };

    // Hacer la llamada
    const response = await fetch(endpoint, {
        method,
        headers: finalHeaders,
        body: body ? JSON.stringify(body) : undefined,
    });

    return response;
}

/**
 * Helper específico para aprobar profesional
 */
export async function approveProfessional(user: User, professionalId: string) {
    const response = await callProtectedAPI(
        user,
        `/api/admin/professionals/${professionalId}/approve`,
        { method: 'POST' }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al aprobar profesional');
    }

    return await response.json();
}

/**
 * Helper específico para rechazar profesional
 */
export async function rejectProfessional(user: User, professionalId: string) {
    const response = await callProtectedAPI(
        user,
        `/api/admin/professionals/${professionalId}/reject`,
        { method: 'POST' }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al rechazar profesional');
    }

    return await response.json();
}

/**
 * Helper específico para cancelar turno desde admin
 */
export async function cancelAppointmentAdmin(
    user: User,
    appointmentId: string,
    reason?: string
) {
    const response = await callProtectedAPI(
        user,
        `/api/admin/appointments/${appointmentId}/cancel`,
        {
            method: 'POST',
            body: { reason },
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al cancelar turno');
    }

    return await response.json();
}
