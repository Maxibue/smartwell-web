import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { withRateLimit, RateLimitPresets } from '@/lib/rate-limit';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const VALID_STATUSES = ['active', 'under_review', 'rejected', 'inactive'] as const;
type UserStatus = typeof VALID_STATUSES[number];

export async function POST(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        // 1. Rate Limiting
        const rateLimitCheck = withRateLimit(RateLimitPresets.admin)(request);
        if (!rateLimitCheck.allowed) {
            return NextResponse.json(
                { error: 'Demasiadas solicitudes.' },
                { status: 429, headers: rateLimitCheck.headers }
            );
        }

        // 2. Verificar admin
        const adminUid = await requireAdmin(request);
        if (!adminUid) {
            return NextResponse.json(
                { error: 'No autorizado.' },
                { status: 401 }
            );
        }

        // 3. Validar body
        const body = await request.json();
        const newStatus: UserStatus = body.status;
        if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
            return NextResponse.json(
                { error: `Estado inválido. Válidos: ${VALID_STATUSES.join(', ')}` },
                { status: 400 }
            );
        }

        const { userId } = params;
        if (!userId) {
            return NextResponse.json({ error: 'ID de usuario inválido.' }, { status: 400 });
        }

        // 4. Verificar que el usuario existe
        const db = getAdminDb();
        const userRef = db.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) {
            return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
        }

        const userData = userSnap.data();
        const previousStatus = userData?.status || 'active';

        // 5. Actualizar estado
        await userRef.update({
            status: newStatus,
            statusUpdatedAt: FieldValue.serverTimestamp(),
            statusUpdatedBy: adminUid,
        });

        // 6. Audit log
        try {
            const adminDoc = await db.collection('users').doc(adminUid).get();
            const adminEmail = adminDoc.exists ? adminDoc.data()?.email : 'unknown';
            await db.collection('audit_logs').add({
                timestamp: FieldValue.serverTimestamp(),
                adminUid,
                adminEmail: adminEmail || 'unknown',
                action: 'UPDATE_USER_STATUS',
                targetId: userId,
                targetType: 'user',
                details: {
                    previousStatus,
                    newStatus,
                    userName: userData?.name || 'Unknown',
                    userEmail: userData?.email || 'Unknown',
                },
            });
        } catch (logError) {
            console.error('Error logging:', logError);
        }

        const labels: Record<UserStatus, string> = {
            active: 'Activo',
            under_review: 'En Revisión',
            rejected: 'Rechazado',
            inactive: 'Inactivo',
        };

        return NextResponse.json({
            success: true,
            message: `Estado actualizado a "${labels[newStatus]}".`,
            data: { userId, previousStatus, newStatus },
        });

    } catch (error: any) {
        console.error('Error updating user status:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno.' },
            { status: 500 }
        );
    }
}
