import Link from 'next/link'

export default function NotFound() {
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
            <span style={{ fontSize: '3rem' }}>🔍</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#15803d', margin: 0 }}>
                Strona nie istnieje
            </h1>
            <p style={{ color: '#4b5563', maxWidth: '28rem', margin: 0 }}>
                Strona, której szukasz, nie istnieje lub została przeniesiona.
            </p>
            <Link
                href="/"
                style={{
                    padding: '0.625rem 1.5rem',
                    background: '#22c55e',
                    color: '#fff',
                    borderRadius: '0.75rem',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                }}
            >
                Wróć do strony głównej
            </Link>
        </div>
    )
}
