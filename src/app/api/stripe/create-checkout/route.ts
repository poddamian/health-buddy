import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe, getOrCreateStripeCustomer } from '@/lib/stripe'

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { priceId, email } = await req.json()

        if (!priceId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const customerId = await getOrCreateStripeCustomer(userId, email ?? '')

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard?upgraded=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/pricing`,
            metadata: { clerk_user_id: userId },
            locale: 'pl',
        })

        return NextResponse.json({ url: session.url })
    } catch (err) {
        console.error('create-checkout error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
