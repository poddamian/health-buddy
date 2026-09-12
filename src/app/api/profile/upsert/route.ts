import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Admin client uses SERVICE_ROLE_KEY – bypasses RLS
function getAdminSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { name, age, habits, goals, checkin_time, streak, subscription_tier, created_at, gender, avatar_url } = body

        const supabase = getAdminSupabase()

        const { error } = await supabase
            .from('profiles')
            .upsert({
                clerk_user_id: userId,
                name,
                age,
                habits,
                goals,
                gender: gender === 'm' || gender === 'k' ? gender : null,
                avatar_url: typeof avatar_url === 'string' && avatar_url ? avatar_url : null,
                checkin_time,
                streak: streak ?? 0,
                subscription_tier: subscription_tier ?? 'free',
                created_at: created_at ?? new Date().toISOString(),
                is_available_for_matching: true,
            }, { onConflict: 'clerk_user_id' })

        if (error) {
            console.error('Profile upsert error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Profile upsert API error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
