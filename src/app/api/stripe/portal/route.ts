import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

export async function POST() {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('clerk_user_id', userId)
            .single()

        if (!profile?.stripe_customer_id) {
            return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard`,
        })

        return NextResponse.json({ url: portalSession.url })
    } catch (err) {
        console.error('portal error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
