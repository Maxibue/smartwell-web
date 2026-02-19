/**
 * Real-time Notifications System for SmartWell
 * Handles in-app notifications for appointments, cancellations, and reminders
 */

import { db } from './firebase';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    serverTimestamp,
    Timestamp,
    getDocs,
    limit
} from 'firebase/firestore';

// Notification Types
export type NotificationType =
    | 'appointment_booked'      // Nuevo turno reservado
    | 'appointment_cancelled'   // Turno cancelado
    | 'appointment_rescheduled' // Turno reagendado
    | 'appointment_reminder'    // Recordatorio de turno próximo
    | 'appointment_confirmed'   // Turno confirmado
    | 'review_approved'         // Calificación aprobada
    | 'review_rejected'         // Calificación rechazada
    | 'review_received'         // Nueva calificación recibida (para profesional)
    | 'review_response'         // Respuesta a calificación (para paciente)
    | 'message_received'        // Mensaje recibido (futuro)
    | 'payment_received';       // Pago recibido (futuro)

export interface Notification {
    id: string;
    userId: string;              // ID del usuario que recibe la notificación
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    createdAt: Timestamp;

    // Metadata opcional
    appointmentId?: string;
    professionalId?: string;
    patientId?: string;
    actionUrl?: string;          // URL para navegar al hacer click

    // Datos adicionales según el tipo
    metadata?: {
        professionalName?: string;
        patientName?: string;
        appointmentDate?: string;
        appointmentTime?: string;
        oldDate?: string;
        oldTime?: string;
        newDate?: string;
        newTime?: string;
    };
}

export interface NotificationData {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    appointmentId?: string;
    professionalId?: string;
    patientId?: string;
    actionUrl?: string;
    metadata?: Notification['metadata'];
}

/**
 * Create a new notification
 */
export async function createNotification(data: NotificationData): Promise<string> {
    try {
        const notificationRef = await addDoc(collection(db, 'notifications'), {
            ...data,
            read: false,
            createdAt: serverTimestamp(),
        });

        console.log('✅ Notification created:', notificationRef.id);
        return notificationRef.id;
    } catch (error) {
        console.error('❌ Error creating notification:', error);
        throw error;
    }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
    try {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, {
            read: true,
        });
        console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
        console.error('❌ Error marking notification as read:', error);
        throw error;
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            where('read', '==', false)
        );

        const querySnapshot = await getDocs(q);
        const updatePromises = querySnapshot.docs.map(doc =>
            updateDoc(doc.ref, { read: true })
        );

        await Promise.all(updatePromises);
        console.log(`✅ Marked ${querySnapshot.size} notifications as read`);
    } catch (error) {
        console.error('❌ Error marking all notifications as read:', error);
        throw error;
    }
}

/**
 * Subscribe to real-time notifications for a user
 */
export function subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void,
    maxNotifications: number = 50
): () => void {
    // Determine query based on index availability
    // Note: For development without indexes, we remove orderBy/limit and do it client-side
    const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
        // orderBy('createdAt', 'desc'), // Requires index
        // limit(maxNotifications)
    );

    const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
            const notifications: Notification[] = [];
            querySnapshot.forEach((doc) => {
                notifications.push({
                    id: doc.id,
                    ...doc.data(),
                } as Notification);
            });

            // Client-side sort
            notifications.sort((a, b) => {
                const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt as any).getTime();
                const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt as any).getTime();
                return timeB - timeA;
            });

            // Client-side limit
            const limitedNotifications = notifications.slice(0, maxNotifications);

            callback(limitedNotifications);
        },
        (error) => {
            console.error('Error in notifications subscription:', error);
            // If index error, try fallback? Currently just logging.
        }
    );

    return unsubscribe;
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId)
            // where('read', '==', false) // Avoid index requirement
        );

        const querySnapshot = await getDocs(q);
        // Filter in memory
        const unreadCount = querySnapshot.docs.filter(doc => !doc.data().read).length;
        return unreadCount;
    } catch (error) {
        console.error('❌ Error getting unread count:', error);
        return 0;
    }
}

// ============================================
// NOTIFICATION CREATORS FOR SPECIFIC EVENTS
// ============================================

/**
 * Create notification when a new appointment is booked (for professional)
 */
export async function notifyProfessionalNewAppointment(data: {
    professionalId: string;
    patientName: string;
    appointmentId: string;
    date: string;
    time: string;
}): Promise<void> {
    await createNotification({
        userId: data.professionalId,
        type: 'appointment_booked',
        title: '🔔 Nuevo Turno Reservado',
        message: `${data.patientName} ha reservado un turno para el ${data.date} a las ${data.time}`,
        appointmentId: data.appointmentId,
        patientId: data.patientName, // Idealmente debería ser el ID
        actionUrl: `/panel-profesional/turnos`,
        metadata: {
            patientName: data.patientName,
            appointmentDate: data.date,
            appointmentTime: data.time,
        },
    });
}

/**
 * Create notification when appointment is confirmed (for patient)
 */
export async function notifyPatientAppointmentConfirmed(data: {
    patientId: string;
    professionalName: string;
    appointmentId: string;
    date: string;
    time: string;
}): Promise<void> {
    await createNotification({
        userId: data.patientId,
        type: 'appointment_confirmed',
        title: '✅ Turno Confirmado',
        message: `Tu turno con ${data.professionalName} para el ${data.date} a las ${data.time} ha sido confirmado`,
        appointmentId: data.appointmentId,
        professionalId: data.professionalName, // Idealmente debería ser el ID
        actionUrl: `/panel-usuario/turnos`,
        metadata: {
            professionalName: data.professionalName,
            appointmentDate: data.date,
            appointmentTime: data.time,
        },
    });
}

/**
 * Create notification when appointment is cancelled
 */
export async function notifyAppointmentCancelled(data: {
    userId: string;
    userType: 'patient' | 'professional';
    otherPartyName: string;
    appointmentId: string;
    date: string;
    time: string;
    reason?: string;
}): Promise<void> {
    const actionUrl = data.userType === 'patient'
        ? '/panel-usuario/turnos'
        : '/panel-profesional/turnos';

    await createNotification({
        userId: data.userId,
        type: 'appointment_cancelled',
        title: '❌ Turno Cancelado',
        message: `El turno con ${data.otherPartyName} del ${data.date} a las ${data.time} ha sido cancelado${data.reason ? `: ${data.reason}` : ''}`,
        appointmentId: data.appointmentId,
        actionUrl,
        metadata: {
            [data.userType === 'patient' ? 'professionalName' : 'patientName']: data.otherPartyName,
            appointmentDate: data.date,
            appointmentTime: data.time,
        },
    });
}

/**
 * Create notification when appointment is rescheduled
 */
export async function notifyAppointmentRescheduled(data: {
    userId: string;
    userType: 'patient' | 'professional';
    otherPartyName: string;
    appointmentId: string;
    oldDate: string;
    oldTime: string;
    newDate: string;
    newTime: string;
}): Promise<void> {
    const actionUrl = data.userType === 'patient'
        ? '/panel-usuario/turnos'
        : '/panel-profesional/turnos';

    await createNotification({
        userId: data.userId,
        type: 'appointment_rescheduled',
        title: '📅 Turno Reagendado',
        message: `El turno con ${data.otherPartyName} ha sido reagendado del ${data.oldDate} ${data.oldTime} al ${data.newDate} ${data.newTime}`,
        appointmentId: data.appointmentId,
        actionUrl,
        metadata: {
            [data.userType === 'patient' ? 'professionalName' : 'patientName']: data.otherPartyName,
            oldDate: data.oldDate,
            oldTime: data.oldTime,
            newDate: data.newDate,
            newTime: data.newTime,
        },
    });
}

/**
 * Create reminder notification for upcoming appointment
 */
export async function notifyAppointmentReminder(data: {
    userId: string;
    userType: 'patient' | 'professional';
    otherPartyName: string;
    appointmentId: string;
    date: string;
    time: string;
    hoursUntil: number;
}): Promise<void> {
    const actionUrl = data.userType === 'patient'
        ? '/panel-usuario/turnos'
        : '/panel-profesional/turnos';

    const timeText = data.hoursUntil === 24
        ? 'mañana'
        : `en ${data.hoursUntil} horas`;

    await createNotification({
        userId: data.userId,
        type: 'appointment_reminder',
        title: '⏰ Recordatorio de Turno',
        message: `Tu turno con ${data.otherPartyName} es ${timeText} (${data.date} a las ${data.time})`,
        appointmentId: data.appointmentId,
        actionUrl,
        metadata: {
            [data.userType === 'patient' ? 'professionalName' : 'patientName']: data.otherPartyName,
            appointmentDate: data.date,
            appointmentTime: data.time,
        },
    });
}

/**
 * Notify professional when patient uploads a payment receipt
 */
export async function notifyProfessionalPaymentReceived(data: {
    professionalId: string;
    patientName: string;
    appointmentId: string;
    date: string;
    time: string;
}): Promise<void> {
    await createNotification({
        userId: data.professionalId,
        type: 'payment_received',
        title: '💳 Comprobante de Pago Recibido',
        message: `${data.patientName} subió el comprobante de seña para el turno del ${data.date} a las ${data.time}. Verificalo en tu panel.`,
        appointmentId: data.appointmentId,
        actionUrl: `/panel-profesional`,
        metadata: {
            patientName: data.patientName,
            appointmentDate: data.date,
            appointmentTime: data.time,
        },
    });
}

/**
 * Notify patient about payment approval or rejection
 */
export async function notifyPatientPaymentResult(data: {
    patientId: string;
    professionalName: string;
    appointmentId: string;
    date: string;
    time: string;
    approved: boolean;
    isSecondRejection?: boolean;
}): Promise<void> {
    const { approved, isSecondRejection } = data;
    await createNotification({
        userId: data.patientId,
        type: approved ? 'appointment_confirmed' : 'appointment_cancelled',
        title: approved
            ? '✅ ¡Pago verificado! Turno confirmado'
            : isSecondRejection
                ? '❌ Turno cancelado por falta de pago'
                : '⚠️ Comprobante rechazado — Reintentá',
        message: approved
            ? `Tu pago fue verificado por ${data.professionalName}. Tu turno del ${data.date} a las ${data.time} está confirmado.`
            : isSecondRejection
                ? `Tu reserva con ${data.professionalName} fue cancelada porque el comprobante no pudo ser verificado.`
                : `${data.professionalName} no pudo verificar tu comprobante. Tenés un intento más para subir uno correcto.`,
        appointmentId: data.appointmentId,
        actionUrl: approved
            ? '/panel-usuario/turnos'
            : `/reservar/pago/${data.appointmentId}`,
        metadata: {
            professionalName: data.professionalName,
            appointmentDate: data.date,
            appointmentTime: data.time,
        },
    });
}
