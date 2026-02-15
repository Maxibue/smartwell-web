import { NextRequest, NextResponse } from 'next/server';
import { sendPatientConfirmationEmail, sendProfessionalNotificationEmail } from '@/lib/email';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-middleware';

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

        // ✅ SEGURIDAD: Verificar que el usuario autenticado es el que envía el email
        // o es un admin/profesional autorizado
        const userId = authResult.user?.uid;

        // Validar que el usuario tiene permiso para enviar este tipo de email
        switch (type) {
            case 'patient_confirmation':
                // Verificar que el paciente es el usuario autenticado
                if (data.patientId && data.patientId !== userId) {
                    return NextResponse.json(
                        { error: 'Unauthorized: Cannot send email for another user' },
                        { status: 403 }
                    );
                }
                await sendPatientConfirmationEmail(data);
                break;

            case 'professional_notification':
                // Verificar que el profesional es el usuario autenticado
                if (data.professionalId && data.professionalId !== userId) {
                    return NextResponse.json(
                        { error: 'Unauthorized: Cannot send email for another user' },
                        { status: 403 }
                    );
                }
                await sendProfessionalNotificationEmail(data);
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
