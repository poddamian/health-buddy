import { NextRequest, NextResponse } from 'next/server'
import { runMatchingFind } from '@/lib/matching-find'

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json()
        if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

        const result = await runMatchingFind(userId)

        if ('error' in result && result.error === 'Profile not found') {
            return NextResponse.json(result, { status: 404 })
        }

        return NextResponse.json(result)
    } catch (err) {
        console.error('[matching/find]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
