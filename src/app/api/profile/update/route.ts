import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { FEATURES, type SubscriptionTier } from '@/lib/features'
import { HABITS } from '@/lib/habits'

function getAdminSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// Partial profile update (name, timezone, habits) for the currently signed-in user only.
export async function PATCH(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { name, timezone, habits } = await req.json()

        const update: Record<string, string | string[]> = {}
        if (typeof name === 'string' && name.trim()) update.name = name.trim()
        if (typeof timezone === 'string' && timezone.trim()) update.timezone = timezone.trim()

        const supabase = getAdminSupabase()

        if (Array.isArray(habits)) {
            const validHabitIds = new Set(HABITS.map((h) => h.id))
            const cleanHabits = [...new Set(habits.filter((h) => typeof h === 'string' && validHabitIds.has(h)))]

            const { data: profile } = await supabase
                .from('profiles')
                .select('subscription_tier')
                .eq('clerk_user_id', userId)
                .single()
            const tier = (profile?.subscription_tier as SubscriptionTier) ?? 'free'
            const maxHabits = FEATURES.max_habits[tier]

            if (cleanHabits.length > maxHabits) {
                return NextResponse.json({ error: `Plan ${tier} pozwala na maksymalnie ${maxHabits} nawyków` }, { status: 403 })
            }

            update.habits = cleanHabits
        }

        if (Object.keys(update).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
        }

        const { error } = await supabase
            .from('profiles')
            .update(update)
            .eq('clerk_user_id', userId)

        if (error) {
            console.error('Profile update error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Profile update API error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
