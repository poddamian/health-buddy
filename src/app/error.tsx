'use client'

import Link from 'next/link'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.5rem',
                background: '#f0fdf4',
                padding: '2rem',
                textAlign: 'center',
            }}
        >
            <span style={{ fontSize: '3rem' }}>😕</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#15803d', margin: 0 }}>
                Coś poszło nie tak
            </h1>
            <p style={{ color: '#4b5563', maxWidth: '28rem', margin: 0 }}>
                Wystąpił nieoczekiwany błąd. Przepraszamy za utrudnienia.
            </p>
            {error?.digest && (
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
                    Kod błędu: {error.digest}
                </p>
            )}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                    onClick={reset}
                    style={{
                        padding: '0.625rem 1.5rem',
                        background: '#22c55e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                    }}
                >
                    Spróbuj ponownie
                </button>
                <Link
                    href="/"
                    style={{
                        padding: '0.625rem 1.5rem',
                        background: 'transparent',
                        color: '#22c55e',
                        border: '2px solid #22c55e',
                        borderRadius: '0.75rem',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        textDecoration: 'none',
                    }}
                >
                    Strona główna
                </Link>
            </div>
        </div>
    )
}
