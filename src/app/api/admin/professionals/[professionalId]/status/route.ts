import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { withRateLimit, RateLimitPresets } from '@/lib/rate-limit';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const VALID_STATUSES = ['pending', 'under_review', 'approved', 'rejected'] as const;
type ProfessionalStatus = typeof VALID_STATUSES[number];

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
                { status: 429, headers: rateLimitCheck.headers }
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

        // 3. Leer y validar el nuevo estado del body
        const body = await request.json();
        const newStatus: ProfessionalStatus = body.status;

        if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
            return NextResponse.json(
                { error: `Estado inválido. Los estados válidos son: ${VALID_STATUSES.join(', ')}` },
                { status: 400 }
            );
        }

        const { professionalId } = params;
        if (!professionalId) {
            return NextResponse.json(
                { error: 'ID de profesional inválido.' },
                { status: 400 }
            );
        }

        // 4. Verificar que el profesional existe
        const dbAdmin = getAdminDb();
        const professionalRef = dbAdmin.collection('professionals').doc(professionalId);
        const professionalSnap = await professionalRef.get();

        if (!professionalSnap.exists) {
            return NextResponse.json(
                { error: 'Profesional no encontrado.' },
                { status: 404 }
            );
        }

        const professionalData = professionalSnap.data();
        const previousStatus = professionalData?.status;

        // 5. Actualizar estado
        await professionalRef.update({
            status: newStatus,
            reviewedAt: FieldValue.serverTimestamp(),
            reviewedBy: adminUid,
            updatedAt: FieldValue.serverTimestamp(),
        });

        // 6. Obtener email del admin para el log
        const adminDoc = await dbAdmin.collection('users').doc(adminUid).get();
        const adminEmail = adminDoc.exists ? adminDoc.data()?.email : 'unknown';

        // 7. Registrar en audit log
        try {
            await dbAdmin.collection('audit_logs').add({
                timestamp: FieldValue.serverTimestamp(),
                adminUid,
                adminEmail: adminEmail || 'unknown',
                action: `UPDATE_PROFESSIONAL_STATUS`,
                targetId: professionalId,
                targetType: 'professional',
                details: {
                    previousStatus: previousStatus || null,
                    newStatus,
                    professionalName: professionalData?.name || 'Unknown',
                    professionalEmail: professionalData?.email || 'Unknown',
                },
            });
        } catch (logError) {
            console.error('Error logging admin action:', logError);
        }

        const statusLabels: Record<ProfessionalStatus, string> = {
            pending: 'Pendiente',
            under_review: 'En Revisión',
            approved: 'Aprobado',
            rejected: 'Rechazado',
        };

        return NextResponse.json({
            success: true,
            message: `Estado actualizado a "${statusLabels[newStatus]}" correctamente.`,
            data: { professionalId, previousStatus, newStatus },
        });

    } catch (error: any) {
        console.error('Error updating professional status:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor.' },
            { status: 500 }
        );
    }
}
