import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

function adminSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const supabase = adminSupabase()

        // Translate Clerk ID → Supabase UUID
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('clerk_user_id', userId)
            .single()

        if (!profile) return NextResponse.json({ status: 'no_profile' })

        const supabaseUserId = profile.id

        // 1. Check for active buddy
        const { data: buddyRow } = await supabase
            .from('buddies')
            .select('user1_id, user2_id, compatibility_score, matched_at')
            .or(`user1_id.eq.${supabaseUserId},user2_id.eq.${supabaseUserId}`)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle()

        if (buddyRow) {
            const buddyId = buddyRow.user1_id === supabaseUserId ? buddyRow.user2_id : buddyRow.user1_id

            const { data: buddyProfile } = await supabase
                .from('profiles')
                .select('id, name, age, habits, checkin_time, streak, created_at, gender')
                .eq('id', buddyId)
                .single()

            return NextResponse.json({
                status: 'matched',
                buddy: {
                    id: buddyProfile?.id,
                    name: buddyProfile?.name,
                    age: buddyProfile?.age,
                    habits: buddyProfile?.habits ?? [],
                    checkin_time: buddyProfile?.checkin_time,
                    streak: buddyProfile?.streak ?? 0,
                    member_since: buddyProfile?.created_at,
                    gender: buddyProfile?.gender ?? null,
                },
                score: buddyRow.compatibility_score ?? 0,
                matched_at: buddyRow.matched_at,
            })
        }

        // 2. Check queue
        const { data: queueRow } = await supabase
            .from('matching_queue')
            .select('joined_at')
            .eq('user_id', supabaseUserId)
            .maybeSingle()

        if (queueRow) {
            const { count } = await supabase
                .from('matching_queue')
                .select('*', { count: 'exact', head: true })
                .lte('joined_at', queueRow.joined_at)

            return NextResponse.json({ status: 'queued', position: count ?? 1 })
        }

        // 3. Available for matching
        return NextResponse.json({ status: 'available' })

    } catch (err) {
        console.error('[matching/status]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

