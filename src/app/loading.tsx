export default function Loading() {
    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                background: '#f0fdf4',
            }}
        >
            <div
                style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '50%',
                    border: '4px solid #dcfce7',
                    borderTopColor: '#22c55e',
                    animation: 'spin 0.8s linear infinite',
                }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#16a34a', fontWeight: 500, fontSize: '1rem' }}>
                Ładowanie…
            </p>
        </div>
    )
}
