import {
  IsEnum,
  IsString,
  IsOptional,
  IsISO8601,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export enum LogCategory {
  AUTH = 'auth',
  USER = 'user',
  SELLER = 'seller',
  PRODUCT = 'product',
  ORDER = 'order',
  SYSTEM = 'system',
  SECURITY = 'security',
  PAYMENT = 'payment',
}

export class LogEventDto {
  @IsString()
  service!: string;

  @IsEnum(LogLevel)
  level!: LogLevel;

  @IsEnum(LogCategory)
  category!: LogCategory;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsISO8601()
  timestamp?: string;

  @IsOptional()
  @IsString()
  traceId?: string;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class LogQueryDto {
  @IsOptional()
  @IsString()
  service?: string;

  @IsOptional()
  @IsEnum(LogLevel)
  level?: LogLevel;

  @IsOptional()
  @IsEnum(LogCategory)
  category?: LogCategory;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class LogEntryResponseDto {
  id!: string;
  service!: string;
  level!: LogLevel;
  category!: LogCategory;
  message!: string;
  userId?: string;
  sellerId?: string;
  metadata?: Record<string, unknown>;
  timestamp!: string;
  traceId?: string;
  ip?: string;
  userAgent?: string;
}

export class LogListResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LogEntryResponseDto)
  logs!: LogEntryResponseDto[];

  @IsInt()
  total!: number;

  @IsInt()
  page!: number;

  @IsInt()
  limit!: number;
}

export class LogStatsDto {
  totalLogs!: number;
  byLevel!: Record<LogLevel, number>;
  byCategory!: Record<LogCategory, number>;
  byService!: Record<string, number>;
}

export class LogDownloadQueryDto {
  @IsOptional()
  @IsString()
  service?: string;

  @IsOptional()
  @IsEnum(LogLevel)
  level?: LogLevel;

  @IsOptional()
  @IsEnum(LogCategory)
  category?: LogCategory;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  limit?: number = 1000;
}
