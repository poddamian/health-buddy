import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
    return NextResponse.json({
        status: 'ok',
        app: 'Health Buddy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    })
}
