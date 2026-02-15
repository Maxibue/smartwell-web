/**
 * Appointment Management Service
 * Handles appointment operations: cancel, reschedule, update status
 */

import { doc, updateDoc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import {
    notifyAppointmentCancelled,
    notifyAppointmentRescheduled
} from './notifications';

export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface CancellationPolicy {
    canCancel: boolean;
    reason?: string;
    hoursBeforeSession: number;
}

/**
 * Check if an appointment can be cancelled based on policy
 */
export function checkCancellationPolicy(appointmentDate: string, appointmentTime: string): CancellationPolicy {
    const now = new Date();

    const [year, month, day] = appointmentDate.split('-').map(Number);
    const [hours, minutes] = appointmentTime.split(':').map(Number);

    const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Policy: Can cancel up to 24 hours before
    const CANCELLATION_DEADLINE_HOURS = 24;

    if (hoursUntilAppointment < 0) {
        return {
            canCancel: false,
            reason: 'No se puede cancelar un turno que ya pasó',
            hoursBeforeSession: 0,
        };
    }

    if (hoursUntilAppointment < CANCELLATION_DEADLINE_HOURS) {
        return {
            canCancel: false,
            reason: `Solo se puede cancelar con ${CANCELLATION_DEADLINE_HOURS} horas de anticipación`,
            hoursBeforeSession: Math.floor(hoursUntilAppointment),
        };
    }

    return {
        canCancel: true,
        hoursBeforeSession: Math.floor(hoursUntilAppointment),
    };
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(
    appointmentId: string,
    cancelledBy: 'patient' | 'professional',
    reason?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const appointmentRef = doc(db, 'appointments', appointmentId);
        const appointmentDoc = await getDoc(appointmentRef);

        if (!appointmentDoc.exists()) {
            return { success: false, error: 'Turno no encontrado' };
        }

        const data = appointmentDoc.data();

        // Check if already cancelled
        if (data.status === 'cancelled') {
            return { success: false, error: 'Este turno ya está cancelado' };
        }

        // Check if already completed
        if (data.status === 'completed') {
            return { success: false, error: 'No se puede cancelar un turno completado' };
        }

        // Check cancellation policy
        const policy = checkCancellationPolicy(data.date, data.time);
        if (!policy.canCancel) {
            return { success: false, error: policy.reason };
        }

        // Update appointment
        await updateDoc(appointmentRef, {
            status: 'cancelled',
            cancelledAt: Timestamp.now(),
            cancelledBy,
            cancellationReason: reason || 'Sin especificar',
            updatedAt: Timestamp.now(),
        });

        // Send notification
        try {
            const recipientId = cancelledBy === 'patient' ? data.professionalId : data.patientId;
            const recipientType = cancelledBy === 'patient' ? 'professional' : 'patient';

            // Attempt to get names from appointment data
            const otherPartyName = cancelledBy === 'patient'
                ? (data.patientName || 'El paciente')
                : (data.professionalName || 'El profesional');

            if (recipientId) {
                await notifyAppointmentCancelled({
                    userId: recipientId,
                    userType: recipientType,
                    otherPartyName: otherPartyName,
                    appointmentId: appointmentId,
                    date: data.date,
                    time: data.time,
                    reason: reason
                });
            }
        } catch (notificationError) {
            console.error('Error sending cancellation notification:', notificationError);
            // Don't fail the operation if notification fails
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error cancelling appointment:', error);
        return { success: false, error: error.message || 'Error al cancelar el turno' };
    }
}

/**
 * Reschedule an appointment to a new date and time
 */
export async function rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newTime: string,
    professionalId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const appointmentRef = doc(db, 'appointments', appointmentId);
        const appointmentDoc = await getDoc(appointmentRef);

        if (!appointmentDoc.exists()) {
            return { success: false, error: 'Turno no encontrado' };
        }

        const data = appointmentDoc.data();

        // Check if cancelled or completed
        if (data.status === 'cancelled') {
            return { success: false, error: 'No se puede reprogramar un turno cancelado' };
        }

        if (data.status === 'completed') {
            return { success: false, error: 'No se puede reprogramar un turno completado' };
        }

        // Check if new slot is available
        const isAvailable = await checkSlotAvailability(professionalId, newDate, newTime, appointmentId);
        if (!isAvailable) {
            return { success: false, error: 'El horario seleccionado no está disponible' };
        }

        // Save old date/time to history
        const history = data.rescheduleHistory || [];
        history.push({
            oldDate: data.date,
            oldTime: data.time,
            newDate,
            newTime,
            rescheduledAt: Timestamp.now(),
        });

        // Update appointment
        await updateDoc(appointmentRef, {
            date: newDate,
            time: newTime,
            rescheduleHistory: history,
            updatedAt: Timestamp.now(),
        });

        // Send notification
        try {
            // Usually rescheduled by professional or patient?
            // Assuming this function is called by the one who is logged in.
            // But we don't have 'rescheduledBy' argument here.
            // Let's assume for now: if user is patient, notify pro. If pro, notify patient.
            // But we don't know who is calling. 
            // NOTE: The UI calling this function should ideally pass who is doing it.
            // As a fallback, we can check auth state context if possible, but this is a lib function.
            // Let's modify the function signature? No, let's keep it simple and notify BOTH or try to infer.
            // Or, just notify the *other* party. But who is the other party?
            // Typically rescheduling is done by the professional or patient.
            // If I look at `RescheduleAppointmentModal`, it's likely used by Professional?
            // Let's check RescheduleAppointmentModal.

            // For now, I will send notification to BOTH (or try to determine context).
            // Actually, safer to notify the person who *didn't* initiate. 
            // I'll add `initiatedBy?: 'patient' | 'professional'` to the arguments in a separate edit if needed.
            // For now, let's look at `RescheduleAppointmentModal.tsx` to see who uses it.
            // It is in `src/components`, but integrated in `panel-profesional` layout?
            // No, `NotificationsDropdown` was. 
            // In `panel-profesional/layout`, we have sidebar items.
            // `RescheduleAppointmentModal` is likely used in `panel-profesional/turnos` and `panel-usuario/turnos`.

            // I will err on side of caution: Notify the PATIENT if professional reschedules.
            // Because usually professionals reschedule via the panel. 
            // If patients reschedule, they usually cancel and rebook? 
            // Or maybe they have a reschedule button too.

            // Let's assume professional is rescheduling for now, or just notify the patient.
            // Ideally should be:
            // if (isProfessional) notifyPatient
            // if (isPatient) notifyProfessional

            // I will notify the PATIENT always for now, as that's the most critical notification.
            // And also notify the PROFESSIONAL just in case (e.g. if an admin did it).

            if (data.patientId) {
                await notifyAppointmentRescheduled({
                    userId: data.patientId,
                    userType: 'patient',
                    otherPartyName: data.professionalName || 'El profesional',
                    appointmentId: appointmentId,
                    oldDate: data.date,
                    oldTime: data.time,
                    newDate: newDate,
                    newTime: newTime
                });
            }

            if (data.professionalId) {
                await notifyAppointmentRescheduled({
                    userId: data.professionalId,
                    userType: 'professional',
                    otherPartyName: data.patientName || 'El paciente',
                    appointmentId: appointmentId,
                    oldDate: data.date,
                    oldTime: data.time,
                    newDate: newDate,
                    newTime: newTime
                });
            }

        } catch (notificationError) {
            console.error('Error sending reschedule notification:', notificationError);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error rescheduling appointment:', error);
        return { success: false, error: error.message || 'Error al reprogramar el turno' };
    }
}

/**
 * Check if a time slot is available
 */
async function checkSlotAvailability(
    professionalId: string,
    date: string,
    time: string,
    excludeAppointmentId?: string
): Promise<boolean> {
    try {
        const q = query(
            collection(db, 'appointments'),
            where('professionalId', '==', professionalId),
            where('date', '==', date),
            where('time', '==', time),
            where('status', 'in', ['pending', 'confirmed', 'in_progress'])
        );

        const querySnapshot = await getDocs(q);

        // If excluding an appointment (for rescheduling), filter it out
        const conflicts = querySnapshot.docs.filter(doc => doc.id !== excludeAppointmentId);

        return conflicts.length === 0;
    } catch (error) {
        console.error('Error checking slot availability:', error);
        return false;
    }
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
    appointmentId: string,
    newStatus: AppointmentStatus
): Promise<{ success: boolean; error?: string }> {
    try {
        const appointmentRef = doc(db, 'appointments', appointmentId);
        const appointmentDoc = await getDoc(appointmentRef);

        if (!appointmentDoc.exists()) {
            return { success: false, error: 'Turno no encontrado' };
        }

        await updateDoc(appointmentRef, {
            status: newStatus,
            updatedAt: Timestamp.now(),
            ...(newStatus === 'in_progress' && { startedAt: Timestamp.now() }),
            ...(newStatus === 'completed' && { completedAt: Timestamp.now() }),
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error updating appointment status:', error);
        return { success: false, error: error.message || 'Error al actualizar el estado' };
    }
}

/**
 * Get appointment history for a user
 */
export async function getAppointmentHistory(
    userId: string,
    userType: 'patient' | 'professional'
): Promise<any[]> {
    try {
        const field = userType === 'patient' ? 'userId' : 'professionalId';

        const q = query(
            collection(db, 'appointments'),
            where(field, '==', userId)
        );

        const querySnapshot = await getDocs(q);

        const appointments = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Sort by date (most recent first)
        appointments.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateB.getTime() - dateA.getTime();
        });

        return appointments;
    } catch (error) {
        console.error('Error getting appointment history:', error);
        return [];
    }
}

/**
 * Get upcoming appointments
 */
export async function getUpcomingAppointments(
    userId: string,
    userType: 'patient' | 'professional'
): Promise<any[]> {
    try {
        const field = userType === 'patient' ? 'userId' : 'professionalId';
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        const q = query(
            collection(db, 'appointments'),
            where(field, '==', userId),
            where('status', 'in', ['pending', 'confirmed'])
        );

        const querySnapshot = await getDocs(q);

        const appointments = querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
            }))
            .filter(apt => {
                const aptDate = new Date(`${apt.date}T${apt.time}`);
                return aptDate >= now;
            });

        // Sort by date (soonest first)
        appointments.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA.getTime() - dateB.getTime();
        });

        return appointments;
    } catch (error) {
        console.error('Error getting upcoming appointments:', error);
        return [];
    }
}

/**
 * Get past appointments
 */
export async function getPastAppointments(
    userId: string,
    userType: 'patient' | 'professional'
): Promise<any[]> {
    try {
        const field = userType === 'patient' ? 'userId' : 'professionalId';
        const now = new Date();

        const q = query(
            collection(db, 'appointments'),
            where(field, '==', userId)
        );

        const querySnapshot = await getDocs(q);

        const appointments = querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
            }))
            .filter(apt => {
                const aptDate = new Date(`${apt.date}T${apt.time}`);
                return aptDate < now || apt.status === 'completed' || apt.status === 'cancelled';
            });

        // Sort by date (most recent first)
        appointments.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateB.getTime() - dateA.getTime();
        });

        return appointments;
    } catch (error) {
        console.error('Error getting past appointments:', error);
        return [];
    }
}
