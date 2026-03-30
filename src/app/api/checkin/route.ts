import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

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

        const { note, checkedHabits } = await req.json()
        const supabase = getAdminSupabase()

        // Get Supabase UUID from clerk_user_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('clerk_user_id', userId)
            .single()

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const supabaseUserId = profile.id
        const today = new Date().toISOString().split('T')[0]

        // Check if already checked in today  
        const { data: existing } = await supabase
            .from('checkins')
            .select('id')
            .eq('user_id', supabaseUserId)
            .eq('date', today)
            .eq('completed', true)
            .maybeSingle()

        if (existing) {
            return NextResponse.json({ alreadyDone: true })
        }

        // Insert check-in
        const { error: checkinError } = await supabase.from('checkins').insert({
            user_id: supabaseUserId,
            date: today,
            completed: true,
            note: note?.trim() || null,
        })

        if (checkinError) {
            console.error('Checkin insert error:', checkinError)
            return NextResponse.json({ error: checkinError.message }, { status: 500 })
        }

        // Increment streak
        await supabase.rpc('increment_streak', { user_id: supabaseUserId })

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Checkin API error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getAdminSupabase()

        // Get Supabase UUID
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('clerk_user_id', userId)
            .single()

        if (!profile) {
            return NextResponse.json({ checkinDone: false })
        }

        const today = new Date().toISOString().split('T')[0]
        const { data: checkin } = await supabase
            .from('checkins')
            .select('id')
            .eq('user_id', profile.id)
            .eq('date', today)
            .eq('completed', true)
            .maybeSingle()

        return NextResponse.json({ checkinDone: !!checkin })
    } catch (err) {
        console.error('Checkin GET error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
