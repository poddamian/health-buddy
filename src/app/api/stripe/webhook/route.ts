export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe, getTierFromPriceId } from '@/lib/stripe'
import Stripe from 'stripe'

function getAdminSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function POST(req: NextRequest) {
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')!

    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = getAdminSupabase()

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                const userId = session.metadata?.clerk_user_id
                if (!userId) break

                let tier = 'premium'
                if (session.mode === 'subscription' && session.subscription) {
                    const sub = await stripe.subscriptions.retrieve(session.subscription as string)
                    tier = getTierFromPriceId(sub.items.data[0].price.id)
                }

                await supabase.from('profiles').update({
                    subscription_tier: tier,
                    subscription_status: 'active',
                    stripe_customer_id: session.customer as string,
                }).eq('clerk_user_id', userId)
                break
            }

            case 'customer.subscription.updated': {
                const sub = event.data.object as Stripe.Subscription
                const customerId = sub.customer as string

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single()

                if (!profile) break

                const tier = getTierFromPriceId(sub.items.data[0].price.id)
                const status = sub.status === 'active' ? 'active'
                    : sub.status === 'past_due' ? 'past_due' : 'canceled'

                await supabase.from('profiles').update({
                    subscription_tier: tier,
                    subscription_status: status,
                    subscription_ends_at: sub.cancel_at
                        ? new Date(sub.cancel_at * 1000).toISOString()
                        : null,
                }).eq('id', profile.id)
                break
            }

            case 'customer.subscription.deleted': {
                const sub = event.data.object as Stripe.Subscription
                const customerId = sub.customer as string

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single()

                if (!profile) break

                await supabase.from('profiles').update({
                    subscription_tier: 'free',
                    subscription_status: 'canceled',
                    subscription_ends_at: null,
                }).eq('id', profile.id)
                break
            }
        }
    } catch (err) {
        console.error('Webhook handler error:', err)
        return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
    }

    return NextResponse.json({ received: true })
}
