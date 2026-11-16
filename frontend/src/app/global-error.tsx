'use client';

// Boundary terakhir: dipakai saat root layout sendiri gagal render, jadi tidak
// boleh bergantung pada komponen mana pun di dalam app.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#F5F0E6',
          color: '#16130F',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          padding: '1.5rem',
        }}
      >
        <main style={{ maxWidth: '34rem', border: '1px solid #D8D0C2', background: '#FFFCF6', padding: '1.75rem' }}>
          <p
            style={{
              margin: 0,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '10px',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#5C544B',
            }}
          >
            Galat aplikasi
          </p>
          <h1 style={{ margin: '0.75rem 0 0', fontSize: '1.6rem', lineHeight: 1.15 }}>
            Aplikasi sedang tidak bisa dimuat
          </h1>
          <p style={{ margin: '0.85rem 0 0', fontSize: '0.95rem', lineHeight: 1.6, color: '#5C544B' }}>
            Tidak ada data yang hilang. Muat ulang halaman ini untuk mencoba lagi.
          </p>
          {error.digest ? (
            <p
              style={{
                margin: '1rem 0 0',
                border: '1px solid #D8D0C2',
                padding: '0.5rem 0.75rem',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '10px',
                color: '#5C544B',
              }}
            >
              Kode acuan: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              minHeight: '44px',
              border: '1px solid #16130F',
              background: '#C63C1C',
              color: '#FFFFFF',
              padding: '0 1.1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Muat ulang
          </button>
          <script
            // Catatan produksi: log galat fatal ke konsol supaya tidak hilang.
            dangerouslySetInnerHTML={{
              __html: `console.error('[global-error]', ${JSON.stringify(String(error.message))});`,
            }}
          />
        </main>
      </body>
    </html>
  );
}