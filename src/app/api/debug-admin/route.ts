import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, adminAuth, adminApp } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        const hasKey = !!process.env.FIREBASE_PRIVATE_KEY;
        const keyLength = process.env.FIREBASE_PRIVATE_KEY?.length || 0;
        const keyExample = process.env.FIREBASE_PRIVATE_KEY?.substring(0, 10) + '...';
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

        // Intentar obtener Firestore Admin
        const db = getAdminDb();
        const collections = await db.listCollections();
        const collectionNames = collections.map(c => c.id).join(', ');

        return NextResponse.json({
            status: 'ok',
            config: {
                hasKey,
                keyLength,
                keyStart: keyExample,
                projectId,
                clientEmail: clientEmail ? 'Set' : 'Missing',
                adminAppInitialized: !!adminApp,
            },
            firestore: {
                connected: true,
                collections: collectionNames
            }
        });
    } catch (error: any) {
        console.error("Debug Error:", error);
        return NextResponse.json({
            status: 'error',
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
