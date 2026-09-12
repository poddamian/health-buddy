import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { runMatchingFind } from '@/lib/matching-find'

export async function POST() {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
