// Sistema de rate limiting simple basado en memoria
// Para producción a escala, considerar usar Upst

ash o Vercel KV

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// Map para almacenar intentos por IP/usuario
const requestCounts = new Map<string, RateLimitEntry>();

/**
 * Configuración de rate limiting
 */
export interface RateLimitConfig {
    windowMs: number; // Ventana de tiempo en milisegundos
    maxRequests: number; // Máximo de requests permitidos en la ventana
}

/**
 * Presets comunes de rate limiting
 */
export const RateLimitPresets = {
    // Para endpoints de autenticación (login, registro)
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        maxRequests: 5, // 5 intentos
    },
    // Para operaciones de admin
    admin: {
        windowMs: 60 * 1000, // 1 minuto
        maxRequests: 30, // 30 operaciones
    },
    // Para API general
    api: {
        windowMs: 60 * 1000, // 1 minuto
        maxRequests: 60, // 60 requests
    },
    // Para envío de emails
    email: {
        windowMs: 60 * 60 * 1000, // 1 hora
        maxRequests: 3, // 3 emails
    },
} as const;

/**
 * Verifica si una petición debe ser bloqueada por rate limiting
 * 
 * @param identifier - Identificador único (IP, userId, email, etc.)
 * @param config - Configuración de rate limiting
 * @returns true si la petición debe ser permitida, false si debe ser bloqueada
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = RateLimitPresets.api
): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = requestCounts.get(identifier);

    // Si no hay entrada o ya expiró, crear nueva
    if (!entry || now > entry.resetTime) {
        const resetTime = now + config.windowMs;
        requestCounts.set(identifier, { count: 1, resetTime });

        // Limpiar entradas expiradas cada cierto tiempo
        cleanupExpiredEntries();

        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetTime,
        };
    }

    // Incrementar contador
    entry.count++;

    // Verificar si excede el límite
    if (entry.count > config.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.resetTime,
        };
    }

    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetTime: entry.resetTime,
    };
}

/**
 * Limpia entradas expiradas del Map
 */
function cleanupExpiredEntries() {
    const now = Date.now();
    for (const [key, entry] of requestCounts.entries()) {
        if (now > entry.resetTime) {
            requestCounts.delete(key);
        }
    }
}

/**
 * Resetea el rate limit para un identificador específico
 * Útil para testing o después de verificación exitosa
 */
export function resetRateLimit(identifier: string): void {
    requestCounts.delete(identifier);
}

/**
 * Obtiene el identificador de rate limiting desde una Request
 */
export function getRateLimitIdentifier(request: Request): string {
    // En producción, obtener la IP real considerando proxies
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] :
        request.headers.get('x-real-ip') ||
        'unknown';

    return ip;
}

/**
 * Middleware helper para Next.js API routes
 */
export function withRateLimit(
    config: RateLimitConfig = RateLimitPresets.api
) {
    return (request: Request): { allowed: boolean; headers: Record<string, string> } => {
        const identifier = getRateLimitIdentifier(request);
        const result = checkRateLimit(identifier, config);

        const headers = {
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
        };

        if (!result.allowed) {
            headers['Retry-After'] = Math.ceil((result.resetTime - Date.now()) / 1000).toString();
        }

        return {
            allowed: result.allowed,
            headers,
        };
    };
}
