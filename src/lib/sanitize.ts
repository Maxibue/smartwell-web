// Utilidades para sanitizar inputs del usuario y prevenir XSS
import DOMPurify from 'isomorphic-dompurify';

/**
 * Opciones de sanitización por tipo de contenido
 */
const SANITIZE_OPTIONS = {
    // Para texto plano (nombres, títulos, etc.)
    text: {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
    },
    // Para contenido HTML limitado (biografías, descripciones)
    html: {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a'],
        ALLOWED_ATTR: ['href', 'target'],
        ALLOWED_URI_REGEXP: /^https?:\/\//,
    },
    // Para comentarios y reviews
    comment: {
        ALLOWED_TAGS: ['p', 'br'],
        ALLOWED_ATTR: [],
    },
};

/**
 * Sanitiza texto plano eliminando cualquier HTML o script
 */
export function sanitizeText(input: string): string {
    if (!input) return '';
    return DOMPurify.sanitize(input.trim(), SANITIZE_OPTIONS.text);
}

/**
 * Sanitiza HTML limitado para biografías y descripciones
 * Permite etiquetas básicas de formato pero elimina scripts y atributos peligrosos
 */
export function sanitizeHTML(input: string): string {
    if (!input) return '';
    return DOMPurify.sanitize(input.trim(), SANITIZE_OPTIONS.html);
}

/**
 * Sanitiza comentarios y reviews
 * Permite solo saltos de línea y párrafos
 */
export function sanitizeComment(input: string): string {
    if (!input) return '';
    return DOMPurify.sanitize(input.trim(), SANITIZE_OPTIONS.comment);
}

/**
 * Valida y sanitiza un email
 */
export function sanitizeEmail(email: string): string {
    if (!email) return '';
    const cleaned = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(cleaned) ? cleaned : '';
}

/**
 * Valida y sanitiza un número de teléfono
 * Solo permite números, espacios, guiones, paréntesis y el símbolo +
 */
export function sanitizePhone(phone: string): string {
    if (!phone) return '';
    return phone.replace(/[^0-9\s\-\(\)\+]/g, '').trim();
}

/**
 * Valida y sanitiza una URL
 * Solo permite URLs HTTPS
 */
export function sanitizeURL(url: string): string {
    if (!url) return '';
    try {
        const urlObj = new URL(url.trim());
        return urlObj.protocol === 'https:' ? urlObj.href : '';
    } catch {
        return '';
    }
}

/**
 * Limita la longitud de un string
 */
export function limitLength(input: string, maxLength: number): string {
    if (!input) return '';
    return input.trim().substring(0, maxLength);
}

/**
 * Sanitiza inputs de formularios de profesionales
 */
export interface ProfessionalFormData {
    name: string;
    email: string;
    phone: string;
    specialty: string;
    title: string;
    bio: string;
    category: string;
}

export function sanitizeProfessionalForm(data: Partial<ProfessionalFormData>): Partial<ProfessionalFormData> {
    return {
        name: data.name ? sanitizeText(limitLength(data.name, 100)) : undefined,
        email: data.email ? sanitizeEmail(data.email) : undefined,
        phone: data.phone ? sanitizePhone(data.phone) : undefined,
        specialty: data.specialty ? sanitizeText(limitLength(data.specialty, 100)) : undefined,
        title: data.title ? sanitizeText(limitLength(data.title, 200)) : undefined,
        bio: data.bio ? sanitizeHTML(limitLength(data.bio, 2000)) : undefined,
        category: data.category ? sanitizeText(data.category) : undefined,
    };
}

/**
 * Sanitiza inputs de reviews
 */
export interface ReviewFormData {
    comment: string;
    rating: number;
}

export function sanitizeReviewForm(data: Partial<ReviewFormData>): Partial<ReviewFormData> {
    return {
        comment: data.comment ? sanitizeComment(limitLength(data.comment, 500)) : undefined,
        rating: data.rating && data.rating >= 1 && data.rating <= 5 ? data.rating : undefined,
    };
}

/**
 * Detecta posibles intentos de XSS
 * Retorna true si el input parece sospechoso
 */
export function detectXSS(input: string): boolean {
    if (!input) return false;

    const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i, // onclick, onerror, etc.
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /eval\(/i,
    ];

    return xssPatterns.some(pattern => pattern.test(input));
}
