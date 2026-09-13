import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { SubscriptionTier } from './features'

export type { SubscriptionTier } from './features'

// Server-side Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
})

// Map Stripe price IDs to tiers
export function getTierFromPriceId(priceId: string): SubscriptionTier {
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID) return 'premium'
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) return 'pro'
    return 'free'
}

// Supabase admin client (server-only, uses service role)
function getAdminSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// Fetch user's current subscription tier from Supabase
export async function getUserSubscriptionTier(userId: string): Promise<SubscriptionTier> {
    const supabase = getAdminSupabase()
    const { data } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single()

    return (data?.subscription_tier as SubscriptionTier) ?? 'free'
}

// Get or create a Stripe customer for a user
export async function getOrCreateStripeCustomer(
    userId: string,
    email: string
): Promise<string> {
    const supabase = getAdminSupabase()

    const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('clerk_user_id', userId)
        .single()

    if (profile?.stripe_customer_id) {
        try {
            const existing = await stripe.customers.retrieve(profile.stripe_customer_id)
            if (!existing.deleted) return existing.id
        } catch {
            // stale id (e.g. left over from Stripe test mode) — fall through and create a new one
        }
    }

    // Create new customer
    const customer = await stripe.customers.create({ email, metadata: { clerk_user_id: userId } })

    await supabase
        .from('profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('clerk_user_id', userId)

    return customer.id
}
