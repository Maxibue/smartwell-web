import { NextRequest, NextResponse } from 'next/server';
import {
    sendPatientConfirmationEmail,
    sendProfessionalNotificationEmail,
    sendAppointmentConfirmedToPatient,
    sendAppointmentCancelledToPatient,
    sendPatientCancelledToProfessional,
    sendPatientRescheduledToProfessional,
    sendAppointmentReminderEmail,
} from '@/lib/email';
import {
    sendDepositInstructionsToPatient,
    sendPaymentRejectedToPatient,
    sendPaymentApprovedToPatient,
    sendPaymentUploadedToProfessional,
} from '@/lib/email-deposit';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-middleware';
import { getAdminDb } from '@/lib/firebase-admin';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
    try {
        // ── Auth ──────────────────────────────────────────────────────────────
        // Internal cron calls authenticate via x-cron-secret header
        const cronHeader = request.headers.get('x-cron-secret');
        const isInternalCronCall = !!(CRON_SECRET && cronHeader === CRON_SECRET);

        if (!isInternalCronCall) {
            // Regular user-triggered calls go through Firebase Auth
            const authResult = await verifyAuth(request);
            if (!authResult.authenticated) {
                console.warn('Unauthorized email send attempt:', authResult.error);
                return unauthorizedResponse(authResult.error);
            }
        }

        const body = await request.json();
        const { type, data } = body;

        if (!type || !data) {
            return NextResponse.json(
                { error: 'Missing required fields: type and data' },
                { status: 400 }
            );
        }

        switch (type) {

            // ── Cron-only cases ────────────────────────────────────────────
            case 'appointment_reminder':
                // Called by /api/cron/appointment-reminders → email to patient
                if (!isInternalCronCall) {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
                }
                await sendAppointmentReminderEmail({
                    patientName: data.patientName || 'Paciente',
                    patientEmail: data.patientEmail,
                    professionalName: data.professionalName,
                    professionalEmail: data.professionalEmail || '',
                    date: data.date,
                    time: data.time,
                    duration: data.duration,
                    price: 0,
                    meetingLink: data.meetingLink,
                });
                break;

            case 'appointment_reminder_professional':
                // Called by /api/cron/appointment-reminders → email to professional
                if (!isInternalCronCall) {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
                }
                if (!data.professionalEmail) {
                    console.warn('Skipping pro reminder: no email');
                    return NextResponse.json({ skipped: true });
                }
                await sendAppointmentReminderEmail({
                    patientName: data.patientName || 'Paciente',
                    patientEmail: data.professionalEmail, // send TO professional
                    professionalName: data.professionalName,
                    professionalEmail: data.professionalEmail,
                    date: data.date,
                    time: data.time,
                    duration: data.duration,
                    price: 0,
                });
                break;

            // ── User-authenticated cases ───────────────────────────────────
            case 'patient_confirmation':
                await sendPatientConfirmationEmail(data);
                break;

            case 'professional_notification':
                await sendProfessionalNotificationEmail(data);
                break;

            case 'appointment_confirmed':
                await sendAppointmentConfirmedToPatient(data);
                break;

            case 'appointment_cancelled':
                await sendAppointmentCancelledToPatient(data);
                break;

            case 'patient_cancelled':
                await sendPatientCancelledToProfessional(data);
                break;

            case 'patient_rescheduled':
                await sendPatientRescheduledToProfessional(data);
                break;

            case 'deposit_instructions':
                await sendDepositInstructionsToPatient(data);
                break;

            case 'payment_rejected':
                await sendPaymentRejectedToPatient(data);
                break;

            case 'payment_approved':
                await sendPaymentApprovedToPatient(data);
                break;

            case 'payment_uploaded': {
                // Fetch professionalEmail from Firestore if missing
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
            }

            default:
                return NextResponse.json(
                    { error: `Unknown email type: ${type}` },
                    { status: 400 }
                );
        }

        console.log(`✅ Email sent - Type: ${type}, Cron: ${isInternalCronCall}`);
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error sending email:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}
