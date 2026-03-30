import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { runMatchingFind } from '@/lib/matching-find'

function adminSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function POST() {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const supabase = adminSupabase()

        // Get Supabase UUID + subscription info
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, subscription_tier, last_rematch_at')
            .eq('clerk_user_id', userId)
            .single()

        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

        const supabaseUserId = profile.id

        // Check subscription + rematch limit for free users
        if (profile?.subscription_tier === 'free' && profile.last_rematch_at) {
            const lastRematch = new Date(profile.last_rematch_at)
            const now = new Date()
            const diffDays = (now.getTime() - lastRematch.getTime()) / (1000 * 60 * 60 * 24)
            if (diffDays < 30) {
                const daysLeft = Math.ceil(30 - diffDays)
                return NextResponse.json({
                    error: `Plan Free pozwala na 1 rematch na miesiąc. Następny rematch za ${daysLeft} dni.`,
                    code: 'rematch_limit',
                    days_left: daysLeft,
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

            // End relationship
            await supabase.from('buddies').update({ status: 'ended' }).eq('id', buddyRow.id)

            // Re-enable matching for both
            await supabase
                .from('profiles')
                .update({ is_available_for_matching: true })
                .in('id', [supabaseUserId, partnerId])
        }

        // Update rematch timestamp (free users only)
        if (profile?.subscription_tier === 'free') {
            await supabase
                .from('profiles')
                .update({ last_rematch_at: new Date().toISOString() })
                .eq('id', supabaseUserId)
        }

        // Remove from queue if present
        await supabase.from('matching_queue').delete().eq('user_id', supabaseUserId)

        // Trigger new find (pass Clerk userId – runMatchingFind now handles translation)
        const result = await runMatchingFind(userId)
        return NextResponse.json(result)

    } catch (err) {
        console.error('[matching/rematch]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

