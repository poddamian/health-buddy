import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

function adminSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// Sends a "nudge" record for the caller's active buddy to see.
// Requires a `nudges` table (from_user_id, to_user_id, created_at) in Supabase.
export async function POST() {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const supabase = adminSupabase()

        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('clerk_user_id', userId)
            .single()

        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

        const { data: buddyRow } = await supabase
            .from('buddies')
            .select('user1_id, user2_id')
            .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle()

        if (!buddyRow) return NextResponse.json({ error: 'No active buddy' }, { status: 404 })

        const buddyId = buddyRow.user1_id === profile.id ? buddyRow.user2_id : buddyRow.user1_id

        const { error } = await supabase.from('nudges').insert({
            from_user_id: profile.id,
            to_user_id: buddyId,
        })

        if (error?.code === '42P01') {
            // ponytail: `nudges` table doesn't exist yet — create it in Supabase to make this real
            return NextResponse.json({ error: 'Nudges not set up yet' }, { status: 501 })
        }
        if (error) {
            console.error('[buddy/nudge]', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('[buddy/nudge]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
