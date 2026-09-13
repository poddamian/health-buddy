import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { canAccessFeature, type SubscriptionTier } from '@/lib/features'

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

        const { data: profile } = await supabase
            .from('profiles')
            .select('id, subscription_tier')
            .eq('clerk_user_id', userId)
            .single()

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const tier = (profile.subscription_tier as SubscriptionTier) ?? 'free'
        if (!canAccessFeature(tier, 'statistics')) {
            return NextResponse.json({ error: 'Requires Premium or Pro' }, { status: 403 })
        }

        const since = new Date()
        since.setDate(since.getDate() - 29)
        const sinceDate = since.toISOString().split('T')[0]

        const { data: checkins } = await supabase
            .from('checkins')
            .select('date, completed, checked_habits')
            .eq('user_id', profile.id)
            .gte('date', sinceDate)
            .order('date', { ascending: true })

        const habitCounts: Record<string, number> = {}
        for (const c of checkins ?? []) {
            for (const habitId of c.checked_habits ?? []) {
                habitCounts[habitId] = (habitCounts[habitId] ?? 0) + 1
            }
        }

        return NextResponse.json({
            last30Days: checkins ?? [],
            habitCounts,
        })
    } catch (err) {
        console.error('Stats GET error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
