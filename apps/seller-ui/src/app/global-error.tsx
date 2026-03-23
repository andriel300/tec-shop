'use client';

// Sentry.init() in instrumentation-client.ts already registers global error listeners,
// so there is no need to import @sentry/nextjs here. A static import would force the
// entire SDK (including the heavy rrweb replay library) into the app-shell bundle,
// consuming 1-3 GB of extra dev compilation memory even when Sentry is disabled.

export default function GlobalError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
          <h2>Something went wrong!</h2>
          <p>We&apos;ve been notified of the error and are working to fix it.</p>
          <button
            onClick={props.reset}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '10px',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
