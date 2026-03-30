import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/onboarding(.*)',
    '/matching(.*)',
    '/checkin-success(.*)',
    '/profile(.*)',
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
    // Redirect www to non-www (canonical domain)
    const host = req.headers.get('host') || ''
    if (host.startsWith('www.')) {
        const newHost = host.replace('www.', '')
        return NextResponse.redirect(
            `https://${newHost}${req.nextUrl.pathname}`,
            301
        )
    }

    // Protect routes
    if (isProtectedRoute(req)) {
        await auth.protect()
    }
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}
