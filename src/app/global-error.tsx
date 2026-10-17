'use client'

import * as Sentry from '@sentry/nextjs'
import NextError from 'next/error'
import { useEffect } from 'react'

// Last-resort boundary for crashes in the root layout itself (error.tsx can't catch those)
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
    useEffect(() => {
        Sentry.captureException(error)
    }, [error])

    return (
        <html lang="pl">
            <body>
                <NextError statusCode={0} />
            </body>
        </html>
    )
}
