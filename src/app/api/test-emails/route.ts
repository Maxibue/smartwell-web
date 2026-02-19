import { NextRequest, NextResponse } from 'next/server';
import { sendDepositInstructionsToPatient, sendPaymentRejectedToPatient, sendPaymentApprovedToPatient } from '@/lib/email-deposit';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({
            error: 'Email parameter required. Usage: /api/test-emails?email=tu@email.com'
        }, { status: 400 });
    }

    try {
        const commonData = {
            patientName: "Maxi (Test)",
            patientEmail: email,
            professionalName: "Dr. SmartWell",
            date: "2024-03-25",
            time: "14:30",
            appointmentId: "test-appointment-id",
        };

        // 1. Instrucciones de seña
        await sendDepositInstructionsToPatient({
            ...commonData,
            duration: 50,
            sessionPrice: 20000,
            depositPercent: 50,
            mpAlias: "alias.prueba.mp",
        });

        // 2. Rechazo de pago (simulado)
        await sendPaymentRejectedToPatient({
            ...commonData,
            rejectionReason: "La imagen está borrosa y no se ve el número de operación.",
            isSecondRejection: false
        });

        // 3. Aprobación de pago (simulado)
        await sendPaymentApprovedToPatient({
            ...commonData,
            duration: 50,
            sessionPrice: 20000,
            meetingLink: "https://meet.google.com/abc-xyz-123"
        });

        return NextResponse.json({
            success: true,
            message: `✅ Se enviaron 3 emails de prueba a ${email}: Instrucciones, Rechazo y Aprobación.`
        });

    } catch (error: any) {
        console.error("Test email error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
