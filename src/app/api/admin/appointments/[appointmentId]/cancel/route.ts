import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { withRateLimit, RateLimitPresets } from '@/lib/rate-limit';
import { logAdminAction, AdminActions } from '@/lib/audit-log';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export async function POST(
    request: NextRequest,
    { params }: { params: { appointmentId: string } }
) {
    try {
        // 1. Rate Limiting
        const rateLimitCheck = withRateLimit(RateLimitPresets.admin)(request);
        if (!rateLimitCheck.allowed) {
            return NextResponse.json(
                { error: 'Demasiadas solicitudes. Intenta nuevamente más tarde.' },
                {
                    status: 429,
                    headers: rateLimitCheck.headers
                }
            );
        }

        // 2. Verificar que es admin
        const adminUid = await requireAdmin(request);
        if (!adminUid) {
            return NextResponse.json(
                { error: 'No autorizado. Se requieren permisos de administrador.' },
                { status: 401 }
            );
        }
        const { appointmentId } = params;

        // 3. Obtener datos del body (razón de cancelación, opcional)
        const body = await request.json();
        const { reason } = body;

        // 4. Verificar que el turno existe
        const appointmentRef = doc(db, 'appointments', appointmentId);
        const appointmentSnap = await getDoc(appointmentRef);

        if (!appointmentSnap.exists()) {
            return NextResponse.json(
                { error: 'Turno no encontrado.' },
                { status: 404 }
            );
        }

        const appointmentData = appointmentSnap.data();
        const previousStatus = appointmentData.status;

        // 5. Verificar que el turno no esté ya cancelado o completado
        if (previousStatus === 'cancelled') {
            return NextResponse.json(
                { error: 'El turno ya está cancelado.' },
                { status: 400 }
            );
        }

        if (previousStatus === 'completed') {
            return NextResponse.json(
                { error: 'No se puede cancelar un turno completado.' },
                { status: 400 }
            );
        }

        // 6. Actualizar estado a cancelado
        await updateDoc(appointmentRef, {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancelledBy: 'admin',
            cancellationReason: reason || 'Cancelado por administrador',
            cancelledByUserId: adminUid,
        });

        // 7. Obtener email del admin para el log
        const adminDoc = await getDoc(doc(db, 'users', adminUid));
        const adminEmail = adminDoc.exists() ? adminDoc.data()?.email : 'unknown';

        // 8. Registrar en audit log
        await logAdminAction(
            adminUid,
            adminEmail,
            AdminActions.CANCEL_APPOINTMENT,
            appointmentId,
            'appointment',
            {
                previousStatus,
                newStatus: 'cancelled',
                patientId: appointmentData.userId,
                professionalId: appointmentData.professionalId,
                appointmentDate: appointmentData.date,
                appointmentTime: appointmentData.time,
                reason: reason || 'Cancelado por administrador',
            }
        );

        // 9. TODO: Enviar notificaciones al paciente y profesional
        // await sendCancellationNotifications(appointmentData);

        return NextResponse.json({
            success: true,
            message: 'Turno cancelado correctamente.',
            data: {
                appointmentId,
                status: 'cancelled',
            }
        });

    } catch (error) {
        console.error('Error cancelling appointment:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor.' },
            { status: 500 }
        );
    }
}
