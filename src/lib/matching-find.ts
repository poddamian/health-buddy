// Shared matching find logic (callable from both find route and rematch route)

import { createClient } from '@supabase/supabase-js'
import { calculateScore, MIN_MATCH_SCORE } from '@/lib/matching'
import type { MatchProfile } from '@/lib/matching'

function adminSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function runMatchingFind(userId: string) {
    const supabase = adminSupabase()

    // 1. Get current user's profile by Clerk user ID
    const { data: me, error: meErr } = await supabase
        .from('profiles')
        .select('id, name, age, habits, checkin_time, timezone, streak, subscription_tier, created_at')
        .eq('clerk_user_id', userId)
        .single()

    if (meErr || !me) return { error: 'Profile not found' }

    // Use Supabase UUID for all subsequent queries
    const supabaseUserId = me.id

    // 2. Check subscription: Free users can only have 1 active buddy
    if (me.subscription_tier === 'free') {
        const { data: existingBuddy } = await supabase
            .from('buddies')
            .select('id')
            .or(`user1_id.eq.${supabaseUserId},user2_id.eq.${supabaseUserId}`)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle()

        if (existingBuddy) {
            return { error: 'Free plan: already has an active buddy' }
        }
    }

    // 3. Get IDs of users already paired with current user
    const { data: existingBuddies } = await supabase
        .from('buddies')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${supabaseUserId},user2_id.eq.${supabaseUserId}`)
        .eq('status', 'active')

    const excludedIds = new Set<string>([supabaseUserId])
    for (const b of existingBuddies ?? []) {
        excludedIds.add(b.user1_id)
        excludedIds.add(b.user2_id)
    }

    // 4. Fetch candidates
    const { data: candidates, error: candErr } = await supabase
        .from('profiles')
        .select('id, name, age, habits, checkin_time, timezone, streak, created_at')
        .eq('is_available_for_matching', true)
        .not('id', 'in', `(${[...excludedIds].join(',')})`)

    if (candErr) return { error: candErr.message }

    const meProfile: MatchProfile = {
        id: supabaseUserId,
        name: me.name ?? '',
        age: me.age ?? null,
        habits: (me.habits as string[]) ?? [],
        checkin_time: me.checkin_time ?? null,
        timezone: me.timezone ?? null,
        streak: me.streak ?? 0,
        created_at: me.created_at ?? null,
    }

    // 5. Score all candidates
    const scored = (candidates ?? [])
        .map((c) =>
            calculateScore(meProfile, {
                id: c.id,
                name: c.name ?? '',
                age: c.age ?? null,
                habits: (c.habits as string[]) ?? [],
                checkin_time: c.checkin_time ?? null,
                timezone: c.timezone ?? null,
                streak: c.streak ?? 0,
                created_at: c.created_at ?? null,
            })
        )
        .filter((r) => r.score >= MIN_MATCH_SCORE)
        .sort((a, b) => b.score - a.score)

    const best = scored[0]

    if (best) {
        // 6a. Create buddies row
        await supabase.from('buddies').insert({
            user1_id: supabaseUserId,
            user2_id: best.profile.id,
            compatibility_score: best.score,
            matched_by: 'algorithm',
            status: 'active',
            matched_at: new Date().toISOString(),
        })

        // 6b. Mark both unavailable
        await supabase
            .from('profiles')
            .update({ is_available_for_matching: false, matching_score_last: best.score })
            .in('id', [supabaseUserId, best.profile.id])

        // 6c. Remove both from queue if present
        await supabase
            .from('matching_queue')
            .delete()
            .in('user_id', [supabaseUserId, best.profile.id])

        return {
            status: 'matched',
            buddy: {
                id: best.profile.id,
                name: best.profile.name,
                age: best.profile.age,
                habits: best.profile.habits,
                shared_habits: best.shared_habits,
                checkin_time: best.profile.checkin_time,
                streak: best.profile.streak,
                member_since: best.profile.created_at,
            },
            score: best.score,
            breakdown: best.breakdown,
        }
    }

    // 6d. No match — add to queue
    await supabase.from('matching_queue').upsert(
        {
            user_id: supabaseUserId,
            joined_at: new Date().toISOString(),
            habits: meProfile.habits,
            checkin_time: meProfile.checkin_time,
            timezone: meProfile.timezone,
        },
        { onConflict: 'user_id' }
    )

    const { count } = await supabase
        .from('matching_queue')
        .select('*', { count: 'exact', head: true })

    return { status: 'queued', position: count ?? 1 }
}
