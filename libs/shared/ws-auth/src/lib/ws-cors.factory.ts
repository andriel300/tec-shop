/**
 * Returns the CORS options object for @WebSocketGateway({ cors: ... }).
 * Reads CORS_ORIGINS from the environment at call time so it works both in
 * NestJS DI context and in decorator metadata (evaluated at module load).
 */
export function createWsGatewayCors() {
  return {
    origin: (
      origin: string,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      const allowedOrigins = process.env['CORS_ORIGINS']?.split(',') ?? [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:4200',
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  };
}
