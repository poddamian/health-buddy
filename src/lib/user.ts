import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

function getAdminSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function getOrCreateProfile(clerkUserId: string, email?: string) {
    const supabase = getAdminSupabase()

    // 1. Try to find existing profile
    const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .single()

    if (existing) return existing

    // 2. Create new profile
    const { data: created, error } = await supabase
        .from('profiles')
        .insert({
            clerk_user_id: clerkUserId,
            email: email ?? null,
            streak: 0,
            subscription_tier: 'free',
        })
        .select('*')
        .single()

    if (error) {
        console.error('[getOrCreateProfile] insert error:', error)
        throw error
    }

    return created
}

export async function getCurrentProfile() {
    const { userId } = await auth()
    if (!userId) return null

    return getOrCreateProfile(userId)
}
