import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

function getAdminSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// Partial profile update (name, timezone) for the currently signed-in user only.
export async function PATCH(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { name, timezone } = await req.json()

        const update: Record<string, string> = {}
        if (typeof name === 'string' && name.trim()) update.name = name.trim()
        if (typeof timezone === 'string' && timezone.trim()) update.timezone = timezone.trim()

        if (Object.keys(update).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
        }

        const supabase = getAdminSupabase()
        const { error } = await supabase
            .from('profiles')
            .update(update)
            .eq('clerk_user_id', userId)

        if (error) {
            console.error('Profile update error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Profile update API error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
