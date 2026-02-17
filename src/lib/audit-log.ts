// Utilidades para registrar acciones de administradores en audit logs
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface AuditLog {
    timestamp: Date;
    adminUid: string;
    adminEmail: string;
    action: string;
    targetId: string;
    targetType: 'user' | 'professional' | 'appointment' | 'review' | 'category';
    details?: Record<string, any>;
    ipAddress?: string;
}

/**
 * Registra una acción de administrador en los logs de auditoría
 */
export async function logAdminAction(
    adminUid: string,
    adminEmail: string,
    action: string,
    targetId: string,
    targetType: 'user' | 'professional' | 'appointment' | 'review' | 'category',
    details?: Record<string, any>
): Promise<void> {
    try {
        await addDoc(collection(db, 'audit_logs'), {
            timestamp: serverTimestamp(),
            adminUid,
            adminEmail,
            action,
            targetId,
            targetType,
            details: details || {},
            // El IP se puede capturar en el backend si es necesario
        });
    } catch (error) {
        console.error('Error logging admin action:', error);
        // No lanzamos el error para que no bloquee la operación principal
    }
}

/**
 * Acciones comunes de administrador
 */
export const AdminActions = {
    APPROVE_PROFESSIONAL: 'approve_professional',
    REJECT_PROFESSIONAL: 'reject_professional',
    DELETE_USER: 'delete_user',
    CANCEL_APPOINTMENT: 'cancel_appointment',
    MODERATE_REVIEW: 'moderate_review',
    CREATE_CATEGORY: 'create_category',
    UPDATE_CATEGORY: 'update_category',
    DELETE_CATEGORY: 'delete_category',
    CHANGE_USER_ROLE: 'change_user_role',
} as const;
