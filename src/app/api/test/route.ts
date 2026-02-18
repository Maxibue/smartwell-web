import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    console.log('🔵 [API] /api/test endpoint called');

    return NextResponse.json({
        success: true,
        message: 'API is working!',
        timestamp: new Date().toISOString()
    });
}

export async function POST(request: NextRequest) {
    console.log('🔵 [API] /api/test POST endpoint called');

    try {
        const body = await request.json();
        console.log('🟡 [API] Request body:', body);

        return NextResponse.json({
            success: true,
            message: 'POST request received',
            receivedData: body,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('❌ [API] Error in test endpoint:', error);
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
