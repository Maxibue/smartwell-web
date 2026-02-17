// API Route protegida para aprobar profesionales
// Solo accesible por administradores, con rate limiting y audit logging

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { withRateLimit, RateLimitPresets } from '@/lib/rate-limit';
import { logAdminAction, AdminActions } from '@/lib/audit-log';
import { getAdmin } from '@/lib/firebase-admin';

export async function POST(
    request: NextRequest,
    { params }: { params: { professionalId: string } }
) {
    try {
        // 1. Rate Limiting
        const rateLimitCheck = withRateLimit(RateLimitPresets.admin)(request);
        if (!rateLimitCheck.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: rateLimitCheck.headers
                }
            );
        }

        // 2. Verificar rol de administrador
        const adminUid = await requireAdmin(request);
        if (!adminUid) {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 401 }
            );
        }

        // 3. Obtener información del admin para audit log
        const admin = getAdmin();
        const adminDoc = await admin.firestore()
            .collection('users')
            .doc(adminUid)
            .get();

        const adminEmail = adminDoc.data()?.email || 'unknown';

        // 4. Actualizar estado del profesional
        const { professionalId } = params;
        const professionalRef = admin.firestore()
            .collection('professionals')
            .doc(professionalId);

        const professionalDoc = await professionalRef.get();
        if (!professionalDoc.exists()) {
            return NextResponse.json(
                { error: 'Professional not found' },
                { status: 404 }
            );
        }

        // Actualizar a estado aprobado
        await professionalRef.update({
            status: 'approved',
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            approvedBy: adminUid,
        });

        // 5. Registrar en audit log
        await logAdminAction(
            adminUid,
            adminEmail,
            AdminActions.APPROVE_PROFESSIONAL,
            professionalId,
            'professional',
            {
                previousStatus: professionalDoc.data()?.status,
                newStatus: 'approved',
            }
        );

        // 6. TODO: Enviar notificación al profesional (implementar después)

        return NextResponse.json(
            {
                success: true,
                message: 'Professional approved successfully',
                professionalId,
            },
            {
                status: 200,
                headers: rateLimitCheck.headers,
            }
        );

    } catch (error: any) {
        console.error('Error approving professional:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
