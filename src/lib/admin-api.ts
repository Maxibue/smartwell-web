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

    console.log('🔵 [API CLIENT] callProtectedAPI called');
    console.log('🟡 [API CLIENT] User:', user?.email);
    console.log('🟡 [API CLIENT] Endpoint:', endpoint);
    console.log('🟡 [API CLIENT] Method:', method);

    // Obtener token de autenticación
    const token = await user.getIdToken();
    console.log('✅ [API CLIENT] Token obtained (first 30 chars):', token.substring(0, 30) + '...');

    // Configurar headers
    const finalHeaders: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...headers,
    };

    console.log('🟡 [API CLIENT] Headers configured:', Object.keys(finalHeaders));

    // Hacer la llamada
    const response = await fetch(endpoint, {
        method,
        headers: finalHeaders,
        body: body ? JSON.stringify(body) : undefined,
    });

    console.log('🟢 [API CLIENT] Response status:', response.status);

    return response;
}

/**
 * Helper genérico para actualizar el estado de un profesional
 */
export async function updateProfessionalStatus(
    user: User,
    professionalId: string,
    status: 'pending' | 'under_review' | 'approved' | 'rejected'
) {
    const response = await callProtectedAPI(
        user,
        `/api/admin/professionals/${professionalId}/status`,
        { method: 'POST', body: { status } }
    );

    const responseClone = response.clone();
    const responseText = await responseClone.text();

    if (!response.ok) {
        try {
            const error = JSON.parse(responseText);
            throw new Error(error.error || 'Error al actualizar estado');
        } catch {
            throw new Error(`Error al actualizar estado (${response.status}): ${responseText}`);
        }
    }

    if (!responseText || responseText.trim() === '') {
        throw new Error('El servidor retornó una respuesta vacía');
    }

    return JSON.parse(responseText);
}

/**
 * Helper específico para aprobar profesional
 */
export async function approveProfessional(user: User, professionalId: string) {
    console.log('🔵 approveProfessional called with:', { professionalId });

    const response = await callProtectedAPI(
        user,
        `/api/admin/professionals/${professionalId}/approve`,
        { method: 'POST' }
    );

    console.log('🟡 Response status:', response.status, response.statusText);

    // Clone response to read it twice if needed
    const responseClone = response.clone();
    const responseText = await responseClone.text();
    console.log('🟢 Response text:', responseText);

    if (!response.ok) {
        // Try to parse error as JSON, fallback to text
        try {
            const error = JSON.parse(responseText);
            throw new Error(error.error || 'Error al aprobar profesional');
        } catch {
            throw new Error(`Error al aprobar profesional (${response.status}): ${responseText || 'Sin respuesta del servidor'}`);
        }
    }

    // Check if response has content before parsing JSON
    if (!responseText || responseText.trim() === '') {
        throw new Error('El servidor retornó una respuesta vacía');
    }

    try {
        return JSON.parse(responseText);
    } catch (parseError) {
        console.error('❌ Error parsing JSON:', parseError);
        throw new Error(`Error al parsear la respuesta del servidor: ${responseText.substring(0, 100)}`);
    }
}

/**
 * Helper específico para rechazar profesional
 */
export async function rejectProfessional(user: User, professionalId: string) {
    console.log('🔵 rejectProfessional called with:', { professionalId });

    const response = await callProtectedAPI(
        user,
        `/api/admin/professionals/${professionalId}/reject`,
        { method: 'POST' }
    );

    console.log('🟡 Response status:', response.status, response.statusText);

    // Clone response to read it twice if needed
    const responseClone = response.clone();
    const responseText = await responseClone.text();
    console.log('🟢 Response text:', responseText);

    if (!response.ok) {
        // Try to parse error as JSON, fallback to text
        try {
            const error = JSON.parse(responseText);
            throw new Error(error.error || 'Error al rechazar profesional');
        } catch {
            throw new Error(`Error al rechazar profesional (${response.status}): ${responseText || 'Sin respuesta del servidor'}`);
        }
    }

    // Check if response has content before parsing JSON
    if (!responseText || responseText.trim() === '') {
        throw new Error('El servidor retornó una respuesta vacía');
    }

    try {
        return JSON.parse(responseText);
    } catch (parseError) {
        console.error('❌ Error parsing JSON:', parseError);
        throw new Error(`Error al parsear la respuesta del servidor: ${responseText.substring(0, 100)}`);
    }
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
