// Plan/feature data with no server-only dependencies — safe to import from client components.
// Keep this free of the `stripe` package: it instantiates a Stripe client at module scope
// using STRIPE_SECRET_KEY, which must never end up in a browser bundle.

export const FEATURES = {
    max_habits: { free: 2, premium: Infinity, pro: Infinity },
    buddy_filters: { free: false, premium: true, pro: true },
    voice_messages: { free: false, premium: true, pro: true },
    statistics: { free: false, premium: true, pro: true },
    groups: { free: false, premium: false, pro: true },
    ai_coach: { free: false, premium: false, pro: true },
    pdf_export: { free: false, premium: false, pro: true },
} as const

export type SubscriptionTier = 'free' | 'premium' | 'pro'
export type Feature = keyof typeof FEATURES

export function canAccessFeature(tier: SubscriptionTier, feature: Feature): boolean {
    const value = FEATURES[feature][tier]
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value > 0
    return false
}
