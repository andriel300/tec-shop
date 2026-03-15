'use client';

// Sentry captures global errors automatically via instrumentation.ts.
// Hooks cannot be used here — this component renders outside the provider
// tree and replaces the root layout during catastrophic failures.

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
