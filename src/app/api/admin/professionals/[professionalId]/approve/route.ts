import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { withRateLimit, RateLimitPresets } from '@/lib/rate-limit';
import { AdminActions } from '@/lib/audit-log';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(
    request: NextRequest,
    { params }: { params: { professionalId: string } }
) {
    console.log('🔵 [API] /api/admin/professionals/[id]/approve called');

    try {
        // 1. Rate Limiting
        console.log('🟡 [API] Checking rate limit...');
        const rateLimitCheck = withRateLimit(RateLimitPresets.admin)(request);
        if (!rateLimitCheck.allowed) {
            console.log('❌ [API] Rate limit exceeded');
            return NextResponse.json(
                { error: 'Demasiadas solicitudes. Intenta nuevamente más tarde.' },
                {
                    status: 429,
                    headers: rateLimitCheck.headers
                }
            );
        }
        console.log('✅ [API] Rate limit passed');

        // 2. Verificar que es admin
        console.log('🟡 [API] Checking admin role...');
        const adminUid = await requireAdmin(request);
        if (!adminUid) {
            console.log('❌ [API] Not authorized - not an admin');
            return NextResponse.json(
                { error: 'No autorizado. Se requieren permisos de administrador.' },
                { status: 401 }
            );
        }
        console.log('✅ [API] Admin check passed, uid:', adminUid);

        const { professionalId } = params;
        console.log('🟡 [API] Professional ID:', professionalId);

        if (!professionalId) {
            console.log('❌ [API] Invalid professional ID');
            return NextResponse.json(
                { error: 'ID de profesional inválido.' },
                { status: 400 }
            );
        }

        // 3. Verificar que el profesional existe
        console.log('🟡 [API] Checking if professional exists...');
        const dbAdmin = getAdminDb();
        const professionalRef = dbAdmin.collection('professionals').doc(professionalId);
        const professionalSnap = await professionalRef.get();

        if (!professionalSnap.exists) {
            console.log('❌ [API] Professional not found:', professionalId);
            return NextResponse.json(
                { error: 'Profesional no encontrado.' },
                { status: 404 }
            );
        }
        console.log('✅ [API] Professional found');

        const professionalData = professionalSnap.data();
        const previousStatus = professionalData?.status;
        console.log('🟡 [API] Current status:', previousStatus);

        // 4. Actualizar estado a aprobado
        console.log('🟡 [API] Updating professional status to approved...');
        await professionalRef.update({
            status: 'approved',
            reviewedAt: FieldValue.serverTimestamp(),
            reviewedBy: adminUid,
            updatedAt: FieldValue.serverTimestamp()
        });
        console.log('✅ [API] Professional status updated');

        // 5. Obtener email del admin para el log
        console.log('🟡 [API] Getting admin email...');
        const adminDoc = await dbAdmin.collection('users').doc(adminUid).get();
        const adminEmail = adminDoc.exists ? adminDoc.data()?.email : 'unknown';
        console.log('🟡 [API] Admin email:', adminEmail);

        // 6. Registrar en audit log
        try {
            console.log('🟡 [API] Creating audit log...');
            await dbAdmin.collection('audit_logs').add({
                timestamp: FieldValue.serverTimestamp(),
                adminUid,
                adminEmail: adminEmail || 'unknown',
                action: AdminActions.APPROVE_PROFESSIONAL,
                targetId: professionalId,
                targetType: 'professional',
                details: {
                    previousStatus: previousStatus || null,
                    newStatus: 'approved',
                    professionalName: professionalData?.name || 'Unknown',
                    professionalEmail: professionalData?.email || 'Unknown',
                },
            });
            console.log('✅ [API] Audit log created');
        } catch (logError) {
            console.error("❌ [API] Error logging admin action:", logError);
        }

        console.log('✅ [API] Returning success response');
        return NextResponse.json({
            success: true,
            message: 'Profesional aprobado correctamente.',
            data: {
                professionalId,
                status: 'approved',
            }
        });

    } catch (error: any) {
        console.error('❌ [API] Error approving professional:', error);
        console.error('❌ [API] Error stack:', error.stack);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor.' },
            { status: 500 }
        );
    }
}

