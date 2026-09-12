import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

function adminSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// Exports everything Health Buddy stores about the caller, as JSON.
export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const supabase = adminSupabase()

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('clerk_user_id', userId)
            .single()

        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

        const { data: checkins } = await supabase
            .from('checkins')
            .select('date, note, completed, checked_habits')
            .eq('user_id', profile.id)
            .order('date', { ascending: false })

        const { data: buddies } = await supabase
            .from('buddies')
            .select('user1_id, user2_id, status, compatibility_score, matched_at')
            .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)

        return NextResponse.json({
            exported_at: new Date().toISOString(),
            profile,
            checkins: checkins ?? [],
            buddies: buddies ?? [],
        })
    } catch (err) {
        console.error('[profile/export]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
