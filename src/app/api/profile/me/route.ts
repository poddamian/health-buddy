import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

function getAdminSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getAdminSupabase()

        const { data, error } = await supabase
            .from('profiles')
            .select('name, subscription_tier, streak, habits, timezone, gender, avatar_url')
            .eq('clerk_user_id', userId)
            .single()

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows found – ok for new users
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ profile: data ?? null })
    } catch (err) {
        console.error('Profile GET API error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
