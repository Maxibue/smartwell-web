import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-middleware';
import { sendPaymentRejectedToPatient, sendPaymentApprovedToPatient } from '@/lib/email-deposit';

export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyAuth(request);
        if (!authResult.authenticated) {
            return unauthorizedResponse(authResult.error);
        }

        const { appointmentId, action, rejectionReason } = await request.json();

        if (!appointmentId || !action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
        }

        const professionalId = authResult.user?.uid;

        // Obtener el turno
        const appointmentRef = db.collection('appointments').doc(appointmentId);
        const snap = await appointmentRef.get();

        if (!snap.exists) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        const data = snap.data()!;

        // Solo el profesional del turno puede aprobar/rechazar
        if (data.professionalId !== professionalId) {
            return NextResponse.json({ error: 'Unauthorized: Not your appointment' }, { status: 403 });
        }

        // Solo se puede revisar si está en payment_submitted
        if (data.status !== 'payment_submitted') {
            return NextResponse.json({ error: 'Appointment is not pending payment review' }, { status: 400 });
        }

        const patientId = data.userId;
        const patientEmail = data.patientEmail;
        const patientName = data.patientName;
        const professionalName = data.professionalName;
        const date = data.date;
        const time = data.time;
        const currentRejections = data.paymentRejections || 0;

        if (action === 'approve') {
            // ── Aprobar: confirmar el turno ──────────────────────────────────
            await appointmentRef.update({
                status: 'confirmed',
                paymentStatus: 'paid',
                paymentApprovedAt: new Date(),
            });

            // Email + notificación al paciente
            await sendPaymentApprovedToPatient({
                patientName,
                patientEmail,
                professionalName,
                date,
                time,
                duration: data.duration,
                sessionPrice: data.price,
                meetingLink: data.meetingUrl,
            }).catch(console.error);

            // Notificación in-app
            const { notifyPatientPaymentResult } = await import('@/lib/notifications');
            await notifyPatientPaymentResult({
                patientId,
                professionalName,
                appointmentId,
                date,
                time,
                approved: true,
            }).catch(console.error);

            return NextResponse.json({ success: true, newStatus: 'confirmed' });

        } else {
            // ── Rechazar ─────────────────────────────────────────────────────
            const newRejections = currentRejections + 1;
            const isSecondRejection = newRejections >= 2;

            await appointmentRef.update({
                status: isSecondRejection ? 'cancelled' : 'payment_rejected',
                paymentStatus: isSecondRejection ? 'failed' : 'rejected',
                paymentRejections: newRejections,
                lastRejectionReason: rejectionReason || '',
                lastRejectedAt: new Date(),
                ...(isSecondRejection ? { cancelledAt: new Date(), cancelReason: 'Pago no verificado' } : {}),
            });

            // Email al paciente
            await sendPaymentRejectedToPatient({
                patientName,
                patientEmail,
                professionalName,
                date,
                time,
                appointmentId,
                isSecondRejection,
                rejectionReason,
            }).catch(console.error);

            // Notificación in-app
            const { notifyPatientPaymentResult } = await import('@/lib/notifications');
            await notifyPatientPaymentResult({
                patientId,
                professionalName,
                appointmentId,
                date,
                time,
                approved: false,
                isSecondRejection,
            }).catch(console.error);

            return NextResponse.json({
                success: true,
                newStatus: isSecondRejection ? 'cancelled' : 'payment_rejected',
                isSecondRejection,
            });
        }
    } catch (error: any) {
        console.error('Error reviewing payment:', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}
