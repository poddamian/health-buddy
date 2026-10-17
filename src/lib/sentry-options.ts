import type { BrowserOptions } from '@sentry/nextjs'

// Shared by browser, server and edge. Without NEXT_PUBLIC_SENTRY_DSN (e.g. local dev) Sentry stays off.
// Request bodies, DB data and local variables can contain users' habits / health data (RODO),
// so we only send the error itself + stack trace. No Session Replay for the same reason.
export const sentryOptions: BrowserOptions = {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    dataCollection: {
        userInfo: false,
        cookies: false,
        httpBodies: [],
        databaseQueryData: false,
        stackFrameVariables: false,
    },
}
