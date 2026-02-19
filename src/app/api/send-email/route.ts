import { NextRequest, NextResponse } from 'next/server';
import {
    sendPatientConfirmationEmail,
    sendProfessionalNotificationEmail,
    sendAppointmentConfirmedToPatient,
    sendAppointmentCancelledToPatient,
    sendPatientCancelledToProfessional,
    sendPatientRescheduledToProfessional,
} from '@/lib/email';
import {
    sendDepositInstructionsToPatient,
    sendPaymentRejectedToPatient,
    sendPaymentApprovedToPatient,
    sendPaymentUploadedToProfessional,
} from '@/lib/email-deposit';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-middleware';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        // ✅ SEGURIDAD: Verificar autenticación antes de procesar
        const authResult = await verifyAuth(request);

        if (!authResult.authenticated) {
            console.warn('Unauthorized email send attempt:', authResult.error);
            return unauthorizedResponse(authResult.error);
        }

        const body = await request.json();
        const { type, data } = body;

        if (!type || !data) {
            return NextResponse.json(
                { error: 'Missing required fields: type and data' },
                { status: 400 }
            );
        }

        const userId = authResult.user?.uid;

        switch (type) {
            case 'patient_confirmation':
                // El paciente (userId) reserva su propio turno → puede enviar ambos emails
                if (data.patientId && data.patientId !== userId) {
                    return NextResponse.json(
                        { error: 'Unauthorized: Cannot send email for another user' },
                        { status: 403 }
                    );
                }
                await sendPatientConfirmationEmail(data);
                break;

            case 'professional_notification':
                // El paciente (userId) reserva → notifica al profesional
                // La verificación es que el patientId coincide con el usuario autenticado
                if (data.patientId && data.patientId !== userId) {
                    return NextResponse.json(
                        { error: 'Unauthorized: Cannot send notification as another user' },
                        { status: 403 }
                    );
                }
                await sendProfessionalNotificationEmail(data);
                break;

            case 'appointment_confirmed':
                // El profesional (userId) confirma un turno → notifica al paciente
                if (data.professionalId && data.professionalId !== userId) {
                    return NextResponse.json(
                        { error: 'Unauthorized: Only the professional can confirm appointments' },
                        { status: 403 }
                    );
                }
                await sendAppointmentConfirmedToPatient(data);
                break;

            case 'appointment_cancelled':
                // El profesional (userId) cancela un turno → notifica al paciente
                if (data.professionalId && data.professionalId !== userId) {
                    return NextResponse.json(
                        { error: 'Unauthorized: Only the professional can cancel appointments' },
                        { status: 403 }
                    );
                }
                await sendAppointmentCancelledToPatient(data);
                break;

            case 'patient_cancelled':
                // El paciente (userId) cancela su propio turno → avisa al profesional
                if (data.patientId && data.patientId !== userId) {
                    return NextResponse.json(
                        { error: 'Unauthorized: Cannot send email for another user' },
                        { status: 403 }
                    );
                }
                await sendPatientCancelledToProfessional(data);
                break;

            case 'patient_rescheduled':
                // El paciente (userId) reagenda su propio turno → avisa al profesional
                if (data.patientId && data.patientId !== userId) {
                    return NextResponse.json(
                        { error: 'Unauthorized: Cannot send email for another user' },
                        { status: 403 }
                    );
                }
                await sendPatientRescheduledToProfessional(data);
                break;

            case 'deposit_instructions':
                // El paciente reserva → recibe instrucciones de pago de seña
                if (data.patientId && data.patientId !== userId) {
                    return NextResponse.json(
                        { error: 'Unauthorized: Cannot send email for another user' },
                        { status: 403 }
                    );
                }
                await sendDepositInstructionsToPatient(data);
                break;

            case 'payment_rejected':
                // El profesional rechaza un comprobante → avisa al paciente
                if (data.professionalId && data.professionalId !== userId) {
                    return NextResponse.json(
                        { error: 'Unauthorized: Only the professional can reject payments' },
                        { status: 403 }
                    );
                }
                await sendPaymentRejectedToPatient(data);
                break;

            case 'payment_approved':
                // El profesional aprueba el pago → turno confirmado, avisa al paciente
                if (data.professionalId && data.professionalId !== userId) {
                    return NextResponse.json(
                        { error: 'Unauthorized: Only the professional can approve payments' },
                        { status: 403 }
                    );
                }
                await sendPaymentApprovedToPatient(data);
                break;

            case 'payment_uploaded':
                // El paciente sube comprobante → avisa al profesional
                // El paciente (userId) puede enviar esto
                if (data.patientId && data.patientId !== userId) {
                    return NextResponse.json(
                        { error: 'Unauthorized: Cannot send email for another user' },
                        { status: 403 }
                    );
                }

                // If professionalEmail is missing, fetch it from Firestore
                if (!data.professionalEmail && data.professionalId) {
                    try {
                        const db = getAdminDb();
                        const profDoc = await db.collection('professionals').doc(data.professionalId).get();
                        if (profDoc.exists) {
                            data.professionalEmail = profDoc.data()?.email;
                        }
                    } catch (e) {
                        console.error('Error fetching professional email:', e);
                    }
                }

                if (!data.professionalEmail) {
                    console.warn('Skipping notification: Professional email not found');
                    return NextResponse.json({ skipped: true, reason: 'Professional email not found' });
                }

                await sendPaymentUploadedToProfessional(data);
                break;

            default:
                return NextResponse.json(
                    { error: `Unknown email type: ${type}` },
                    { status: 400 }
                );
        }

        // Log de auditoría
        console.log(`Email sent successfully - Type: ${type}, User: ${userId}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error sending email:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}
