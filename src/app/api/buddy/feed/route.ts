import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

function adminSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// Recent check-ins of the caller's active buddy (real activity feed).
export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const supabase = adminSupabase()

        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('clerk_user_id', userId)
            .single()

        if (!profile) return NextResponse.json({ feed: [] })

        const { data: buddyRow } = await supabase
            .from('buddies')
            .select('user1_id, user2_id')
            .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle()

        if (!buddyRow) return NextResponse.json({ feed: [] })

        const buddyId = buddyRow.user1_id === profile.id ? buddyRow.user2_id : buddyRow.user1_id

        const { data: checkins } = await supabase
            .from('checkins')
            .select('date, note, completed')
            .eq('user_id', buddyId)
            .order('date', { ascending: false })
            .limit(5)

        return NextResponse.json({ feed: checkins ?? [] })
    } catch (err) {
        console.error('[buddy/feed]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
