import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { runMatchingFind } from '@/lib/matching-find'

const CHANGE_BUDDY_COOLDOWN_DAYS = 14

function adminSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// GET – check if user can change buddy and when
export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const supabase = adminSupabase()

        // Get profile UUID + last_rematch_at
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, last_rematch_at')
            .eq('clerk_user_id', userId)
            .single()

        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

        // Check active buddy
        const { data: buddyRow } = await supabase
            .from('buddies')
            .select('matched_at')
            .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle()

        if (!buddyRow) {
            return NextResponse.json({ hasBuddy: false, canChange: false })
        }

        const matchedAt = new Date(buddyRow.matched_at)
        const now = new Date()
        const daysSinceMatch = (now.getTime() - matchedAt.getTime()) / (1000 * 60 * 60 * 24)
        const canChange = daysSinceMatch >= CHANGE_BUDDY_COOLDOWN_DAYS
        const daysLeft = canChange ? 0 : Math.ceil(CHANGE_BUDDY_COOLDOWN_DAYS - daysSinceMatch)

        return NextResponse.json({
            hasBuddy: true,
            canChange,
            daysLeft,
            matchedAt: buddyRow.matched_at,
        })
    } catch (err) {
        console.error('[buddy/change GET]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST – actually change buddy
export async function POST() {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const supabase = adminSupabase()

        // Get Supabase UUID
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, last_rematch_at')
            .eq('clerk_user_id', userId)
            .single()

        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

        const supabaseUserId = profile.id

        // Enforce 14-day cooldown
        if (profile.last_rematch_at) {
            const lastRematch = new Date(profile.last_rematch_at)
            const daysSince = (Date.now() - lastRematch.getTime()) / (1000 * 60 * 60 * 24)
            if (daysSince < CHANGE_BUDDY_COOLDOWN_DAYS) {
                const daysLeft = Math.ceil(CHANGE_BUDDY_COOLDOWN_DAYS - daysSince)
                return NextResponse.json({
                    error: `Możesz zmienić Buddy za ${daysLeft} dni.`,
                    code: 'cooldown',
                    daysLeft,
                }, { status: 403 })
            }
        }

        // Find active buddy row
        const { data: buddyRow } = await supabase
            .from('buddies')
            .select('id, user1_id, user2_id')
            .or(`user1_id.eq.${supabaseUserId},user2_id.eq.${supabaseUserId}`)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle()

        if (buddyRow) {
            const partnerId = buddyRow.user1_id === supabaseUserId ? buddyRow.user2_id : buddyRow.user1_id

            // End old relationship
            await supabase.from('buddies').update({ status: 'ended' }).eq('id', buddyRow.id)

            // Re-enable matching for partner
            await supabase
                .from('profiles')
                .update({ is_available_for_matching: true })
                .eq('id', partnerId)
        }

        // Record rematch timestamp + mark as available
        await supabase
            .from('profiles')
            .update({
                last_rematch_at: new Date().toISOString(),
                is_available_for_matching: true,
            })
            .eq('id', supabaseUserId)

        // Remove from queue if present
        await supabase.from('matching_queue').delete().eq('user_id', supabaseUserId)

        // Trigger new matching (pass Clerk userId – runMatchingFind now handles translation)
        const result = await runMatchingFind(userId)
        return NextResponse.json(result)

    } catch (err) {
        console.error('[buddy/change POST]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
