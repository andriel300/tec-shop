import { Injectable, Logger } from '@nestjs/common';
import { LoggerPrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import type {
  LogEventDto,
  LogQueryDto,
  LogEntryResponseDto,
  LogListResponseDto,
  LogStatsDto,
  LogDownloadQueryDto,
} from '@tec-shop/dto';

const RECENT_LOGS_KEY = 'recent-logs';
const RECENT_LOGS_TTL = 3600;
const RECENT_LOGS_MAX = 100;

@Injectable()
export class LoggerCoreService {
  private readonly logger = new Logger(LoggerCoreService.name);

  constructor(
    private readonly prisma: LoggerPrismaService,
    private readonly redis: RedisService
  ) {}

  async saveLog(dto: LogEventDto): Promise<LogEntryResponseDto> {
    const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();

    const logEntry = await this.prisma.logEntry.create({
      data: {
        service: dto.service,
        level: dto.level,
        category: dto.category,
        message: dto.message,
        userId: dto.userId,
        sellerId: dto.sellerId,
        metadata: dto.metadata ?? undefined,
        timestamp,
        traceId: dto.traceId,
        ip: dto.ip,
        userAgent: dto.userAgent,
      },
    });

    const response: LogEntryResponseDto = {
      id: logEntry.id,
      service: logEntry.service,
      level: logEntry.level as LogEntryResponseDto['level'],
      category: logEntry.category as LogEntryResponseDto['category'],
      message: logEntry.message,
      userId: logEntry.userId ?? undefined,
      sellerId: logEntry.sellerId ?? undefined,
      metadata: logEntry.metadata as Record<string, unknown> | undefined,
      timestamp: logEntry.timestamp.toISOString(),
      traceId: logEntry.traceId ?? undefined,
      ip: logEntry.ip ?? undefined,
      userAgent: logEntry.userAgent ?? undefined,
    };

    await this.cacheRecentLog(response);

    return response;
  }

  private async cacheRecentLog(log: LogEntryResponseDto): Promise<void> {
    try {
      await this.redis.lpush(RECENT_LOGS_KEY, JSON.stringify(log));
      await this.redis.ltrim(RECENT_LOGS_KEY, 0, RECENT_LOGS_MAX - 1);
      await this.redis.expire(RECENT_LOGS_KEY, RECENT_LOGS_TTL);
    } catch (error) {
      this.logger.warn('Failed to cache recent log', error);
    }
  }

  async getRecentLogs(limit = 50): Promise<LogEntryResponseDto[]> {
    try {
      const cached = await this.redis.lrange(RECENT_LOGS_KEY, 0, limit - 1);
      if (cached.length > 0) {
        return cached.map((item) => JSON.parse(item) as LogEntryResponseDto);
      }
    } catch (error) {
      this.logger.warn('Failed to get cached logs, falling back to DB', error);
    }

    const logs = await this.prisma.logEntry.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
    });

    return logs.map((log) => ({
      id: log.id,
      service: log.service,
      level: log.level as LogEntryResponseDto['level'],
      category: log.category as LogEntryResponseDto['category'],
      message: log.message,
      userId: log.userId ?? undefined,
      sellerId: log.sellerId ?? undefined,
      metadata: log.metadata as Record<string, unknown> | undefined,
      timestamp: log.timestamp.toISOString(),
      traceId: log.traceId ?? undefined,
      ip: log.ip ?? undefined,
      userAgent: log.userAgent ?? undefined,
    }));
  }

  async queryLogs(query: LogQueryDto): Promise<LogListResponseDto> {
    const page = typeof query.page === 'string' ? parseInt(query.page, 10) : (query.page ?? 1);
    const limit = typeof query.limit === 'string' ? parseInt(query.limit, 10) : (query.limit ?? 50);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.service) {
      where.service = query.service;
    }

    if (query.level) {
      where.level = query.level;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.sellerId) {
      where.sellerId = query.sellerId;
    }

    if (query.search) {
      where.message = { contains: query.search, mode: 'insensitive' };
    }

    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) {
        (where.timestamp as Record<string, Date>).gte = new Date(
          query.startDate
        );
      }
      if (query.endDate) {
        (where.timestamp as Record<string, Date>).lte = new Date(query.endDate);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.logEntry.findMany({
        where,
        take: limit,
        skip,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.logEntry.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        service: log.service,
        level: log.level as LogEntryResponseDto['level'],
        category: log.category as LogEntryResponseDto['category'],
        message: log.message,
        userId: log.userId ?? undefined,
        sellerId: log.sellerId ?? undefined,
        metadata: log.metadata as Record<string, unknown> | undefined,
        timestamp: log.timestamp.toISOString(),
        traceId: log.traceId ?? undefined,
        ip: log.ip ?? undefined,
        userAgent: log.userAgent ?? undefined,
      })),
      total,
      page,
      limit,
    };
  }

  async getStats(): Promise<LogStatsDto> {
    const [totalLogs, byLevel, byCategory, byService] = await Promise.all([
      this.prisma.logEntry.count(),
      this.prisma.logEntry.groupBy({
        by: ['level'],
        _count: { level: true },
      }),
      this.prisma.logEntry.groupBy({
        by: ['category'],
        _count: { category: true },
      }),
      this.prisma.logEntry.groupBy({
        by: ['service'],
        _count: { service: true },
      }),
    ]);

    const levelCounts: Record<string, number> = {};
    for (const item of byLevel) {
      levelCounts[item.level] = item._count.level;
    }

    const categoryCounts: Record<string, number> = {};
    for (const item of byCategory) {
      categoryCounts[item.category] = item._count.category;
    }

    const serviceCounts: Record<string, number> = {};
    for (const item of byService) {
      serviceCounts[item.service] = item._count.service;
    }

    return {
      totalLogs,
      byLevel: levelCounts as LogStatsDto['byLevel'],
      byCategory: categoryCounts as LogStatsDto['byCategory'],
      byService: serviceCounts,
    };
  }

  async downloadLogs(query: LogDownloadQueryDto): Promise<string> {
    const limit = typeof query.limit === 'string' ? parseInt(query.limit, 10) : (query.limit ?? 1000);

    const where: Record<string, unknown> = {};

    if (query.service) {
      where.service = query.service;
    }

    if (query.level) {
      where.level = query.level;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.search) {
      where.message = { contains: query.search, mode: 'insensitive' };
    }

    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) {
        (where.timestamp as Record<string, Date>).gte = new Date(
          query.startDate
        );
      }
      if (query.endDate) {
        (where.timestamp as Record<string, Date>).lte = new Date(query.endDate);
      }
    }

    const logs = await this.prisma.logEntry.findMany({
      where,
      take: limit,
      orderBy: { timestamp: 'desc' },
    });

    const lines = logs.map((log) => {
      const timestamp = log.timestamp.toISOString();
      const level = log.level.toUpperCase().padEnd(5);
      const service = log.service.padEnd(15);
      const category = log.category.padEnd(10);
      const userId = log.userId ? `userId=${log.userId}` : '';
      const sellerId = log.sellerId ? `sellerId=${log.sellerId}` : '';
      const traceId = log.traceId ? `traceId=${log.traceId}` : '';
      const extra = [userId, sellerId, traceId].filter(Boolean).join(' ');

      return `[${timestamp}] ${level} [${service}] [${category}] ${log.message}${extra ? ` | ${extra}` : ''}`;
    });

    return lines.join('\n');
  }
}
