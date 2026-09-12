import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

function adminSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// Permanently deletes the caller's account: Supabase data + the Clerk user itself.
export async function DELETE() {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const supabase = adminSupabase()

        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('clerk_user_id', userId)
            .single()

        if (profile) {
            const { data: activeBuddy } = await supabase
                .from('buddies')
                .select('id, user1_id, user2_id')
                .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
                .eq('status', 'active')
                .limit(1)
                .maybeSingle()

            if (activeBuddy) {
                const partnerId = activeBuddy.user1_id === profile.id ? activeBuddy.user2_id : activeBuddy.user1_id
                await supabase.from('buddies').update({ status: 'ended' }).eq('id', activeBuddy.id)
                await supabase.from('profiles').update({ is_available_for_matching: true }).eq('id', partnerId)
            }

            await supabase.from('checkins').delete().eq('user_id', profile.id)
            await supabase.from('matching_queue').delete().eq('user_id', profile.id)
            await supabase.from('buddies').delete().or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
            await supabase.from('profiles').delete().eq('id', profile.id)
        }

        const clerk = await clerkClient()
        await clerk.users.deleteUser(userId)

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('[profile/delete]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
