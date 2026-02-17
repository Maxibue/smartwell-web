import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { withRateLimit, RateLimitPresets } from '@/lib/rate-limit';
import { logAdminAction, AdminActions } from '@/lib/audit-log';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export async function POST(
    request: NextRequest,
    { params }: { params: { professionalId: string } }
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
        const { professionalId } = params;

        // 3. Verificar que el profesional existe
        const professionalRef = doc(db, 'professionals', professionalId);
        const professionalSnap = await getDoc(professionalRef);

        if (!professionalSnap.exists()) {
            return NextResponse.json(
                { error: 'Profesional no encontrado.' },
                { status: 404 }
            );
        }

        const professionalData = professionalSnap.data();
        const previousStatus = professionalData.status;

        // 4. Actualizar estado a rechazado
        await updateDoc(professionalRef, {
            status: 'rejected',
            reviewedAt: new Date(),
            reviewedBy: adminUid,
        });

        // 5. Obtener email del admin para el log
        const adminDoc = await getDoc(doc(db, 'users', adminUid));
        const adminEmail = adminDoc.exists() ? adminDoc.data()?.email : 'unknown';

        // 6. Registrar en audit log
        await logAdminAction(
            adminUid,
            adminEmail,
            AdminActions.REJECT_PROFESSIONAL,
            professionalId,
            'professional',
            {
                previousStatus,
                newStatus: 'rejected',
                professionalName: professionalData.name,
                professionalEmail: professionalData.email,
            }
        );

        // 7. TODO: Enviar email al profesional notificando el rechazo
        // await sendRejectionEmail(professionalData.email, professionalData.name);

        return NextResponse.json({
            success: true,
            message: 'Profesional rechazado correctamente.',
            data: {
                professionalId,
                status: 'rejected',
            }
        });

    } catch (error) {
        console.error('Error rejecting professional:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor.' },
            { status: 500 }
        );
    }
}
