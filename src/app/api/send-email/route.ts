import { NextRequest, NextResponse } from 'next/server';
import { sendPatientConfirmationEmail, sendProfessionalNotificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, data } = body;

        if (!type || !data) {
            return NextResponse.json(
                { error: 'Missing required fields: type and data' },
                { status: 400 }
            );
        }

        switch (type) {
            case 'patient_confirmation':
                await sendPatientConfirmationEmail(data);
                break;

            case 'professional_notification':
                await sendProfessionalNotificationEmail(data);
                break;

            default:
                return NextResponse.json(
                    { error: `Unknown email type: ${type}` },
                    { status: 400 }
                );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error sending email:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}
