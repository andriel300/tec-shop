export class LogEntry {
  id: string;
  service: string;
  level: string;
  category: string;
  message: string;
  userId: string | null;
  sellerId: string | null;
  metadata: Record<string, unknown> | null;
  timestamp: Date;
  traceId: string | null;
  ip: string | null;
  userAgent: string | null;
}
