import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import {
  randomBytes,
  createHmac,
  createCipheriv,
  createDecipheriv,
} from 'crypto';
import { UnauthorizedException, NotFoundException, ForbiddenException, BadRequestException, TooManyRequestsException } from '@nestjs/common';
import { MonoPrismaService } from '../prisma/prisma.service';
import { RedisService } from '@tec-shop/redis-client';

// ─── RFC 6238 TOTP Implementation (no external library) ───────────────────────

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf: Buffer): string {
  let output = '';
  let bits = 0;
  let value = 0;
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(str: string): Buffer {
  const s = str.toUpperCase().replace(/=+$/, '');
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of s) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) {
      throw new Error(`Invalid base32 character: '${char}'`);
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function computeTotp(secret: string, counter: number, digits = 6): string {
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const secretBuf = base32Decode(secret);
  const hmac = createHmac('sha1', secretBuf).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % Math.pow(10, digits)).toString().padStart(digits, '0');
}

function verifyTotpGetCounter(
  secret: string,
  token: string,
  window = 1,
  timeStep = 30,
): number {
  const counter = Math.floor(Date.now() / 1000 / timeStep);
  for (let i = -window; i <= window; i++) {
    if (computeTotp(secret, counter + i) === token) return counter + i;
  }
  return -1;
}

function generateBase32Secret(bytes = 20): string {
  return base32Encode(randomBytes(bytes));
}

function totpKeyUri(email: string, issuer: string, secret: string): string {
  return (
    `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}` +
    `?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
  );
}

// ─── Service ────────────────────────────────────────────────────────────────────

/** Redis TTL covering the full ±1 counter window (3 × 30s steps). */
const TOTP_USED_TTL_SECONDS = 90;

/** Per-userId failed-attempt lockout window (10 minutes). */
const TOTP_ATTEMPT_WINDOW_SECONDS = 600;

/** Maximum TOTP failures before userId-scoped lockout. */
const TOTP_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthTotpService implements OnModuleInit {
  private readonly logger = new Logger(AuthTotpService.name);
  private encryptionKey!: Buffer;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: MonoPrismaService,
    private readonly redis: RedisService,
  ) {}

  onModuleInit() {
    const key = this.configService.get<string>('TOTP_ENCRYPTION_KEY');
    if (!key || key.length !== 64) {
      throw new Error(
        'TOTP_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
        'Generate one with: openssl rand -hex 32',
      );
    }
    this.encryptionKey = Buffer.from(key, 'hex');
    this.logger.log('TOTP encryption key loaded');
  }

  async setupTotp(userId: string): Promise<{
    qrCodeUrl: string;
    secret: string;
    backupCodes: string[];
  }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.userType !== 'ADMIN') {
      throw new ForbiddenException('TOTP is only available for admin accounts');
    }
    if (user.totpEnabled) {
      throw new BadRequestException('TOTP is already enabled. Disable it first before re-enrolling.');
    }

    const secret = generateBase32Secret(20);
    const encryptedSecret = this.encryptSecret(secret);
    const backupCodes = await this.generateBackupCodes();

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: encryptedSecret,
        totpBackupCodes: backupCodes.hashed,
      },
    });

    const qrCodeUrl = totpKeyUri(user.email, 'TecShop Admin', secret);

    this.logger.log(`Admin TOTP setup initiated - userId: ${userId}`);

    return { qrCodeUrl, secret, backupCodes: backupCodes.plain };
  }

  async enableTotp(userId: string, token: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user?.totpSecret) {
      throw new BadRequestException('TOTP setup not initiated. Call setup first.');
    }
    if (user.totpEnabled) {
      throw new BadRequestException('TOTP is already enabled');
    }

    const secret = this.decryptSecret(user.totpSecret);
    const matchedCounter = verifyTotpGetCounter(secret, token);
    if (matchedCounter === -1) {
      this.logger.warn(`Admin TOTP enable failed - invalid code for userId: ${userId}`);
      throw new UnauthorizedException('Invalid TOTP code. Ensure your authenticator app is synced.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true },
    });

    this.logger.log(`Admin TOTP enabled - userId: ${userId}`);
  }

  async verifyTotpForLogin(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpSecret || !user.totpEnabled) return false;

    await this.assertAttemptLimit(userId);

    const secret = this.decryptSecret(user.totpSecret);
    const matchedCounter = verifyTotpGetCounter(secret, token);

    if (matchedCounter !== -1) {
      const replayKey = `totp:used:${userId}:${matchedCounter}`;
      const alreadyUsed = await this.redis.exists(replayKey);
      if (alreadyUsed > 0) {
        this.logger.warn(`Admin TOTP replay attempt blocked - userId: ${userId}`);
        await this.incrementAttempts(userId);
        return false;
      }
      await this.redis.set(replayKey, '1', TOTP_USED_TTL_SECONDS);
      await this.clearAttempts(userId);
      this.logger.log(`Admin TOTP login verified - userId: ${userId}`);
      return true;
    }

    const usedBackup = await this.consumeBackupCode(userId, token, user.totpBackupCodes);
    if (usedBackup) {
      await this.clearAttempts(userId);
      this.logger.warn(`Admin TOTP login via backup code - userId: ${userId}`);
      return true;
    }

    await this.incrementAttempts(userId);
    this.logger.warn(`Admin TOTP verification failed - userId: ${userId}`);
    return false;
  }

  async disableTotp(userId: string, token: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user?.totpSecret || !user.totpEnabled) {
      throw new BadRequestException('TOTP is not enabled');
    }

    const secret = this.decryptSecret(user.totpSecret);
    const matchedCounter = verifyTotpGetCounter(secret, token);
    if (matchedCounter === -1) {
      this.logger.warn(`Admin TOTP disable rejected - invalid code for userId: ${userId}`);
      throw new UnauthorizedException('Invalid TOTP code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: false, totpSecret: null, totpBackupCodes: [] },
    });

    this.logger.log(`Admin TOTP disabled - userId: ${userId}`);
  }

  async getTotpStatus(userId: string): Promise<{
    enabled: boolean;
    backupCodesRemaining: number;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpEnabled: true, totpBackupCodes: true },
    });
    return {
      enabled: user?.totpEnabled ?? false,
      backupCodesRemaining: user?.totpBackupCodes?.length ?? 0,
    };
  }

  // --- Private helpers -------------------------------------------------------

  private async assertAttemptLimit(userId: string): Promise<void> {
    const key = `totp-attempts:${userId}`;
    const raw = await this.redis.get(key);
    const attempts = raw ? parseInt(raw, 10) : 0;
    if (attempts >= TOTP_MAX_ATTEMPTS) {
      throw new TooManyRequestsException('Too many failed TOTP attempts. Try again in 10 minutes.');
    }
  }

  private async incrementAttempts(userId: string): Promise<void> {
    const key = `totp-attempts:${userId}`;
    const raw = await this.redis.get(key);
    const attempts = raw ? parseInt(raw, 10) : 0;
    await this.redis.set(key, String(attempts + 1), TOTP_ATTEMPT_WINDOW_SECONDS);
  }

  private async clearAttempts(userId: string): Promise<void> {
    await this.redis.del(`totp-attempts:${userId}`);
  }

  private async consumeBackupCode(
    userId: string,
    code: string,
    hashed: string[],
  ): Promise<boolean> {
    for (let i = 0; i < hashed.length; i++) {
      if (await argon2.verify(hashed[i], code)) {
        const remaining = [...hashed];
        remaining.splice(i, 1);
        await this.prisma.user.update({
          where: { id: userId },
          data: { totpBackupCodes: remaining },
        });
        return true;
      }
    }
    return false;
  }

  private async generateBackupCodes(): Promise<{ plain: string[]; hashed: string[] }> {
    const plain: string[] = [];
    const hashed: string[] = [];
    for (let i = 0; i < 10; i++) {
      const raw = randomBytes(5).toString('hex').toUpperCase();
      const formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`;
      plain.push(formatted);
      hashed.push(await argon2.hash(formatted));
    }
    return { plain, hashed };
  }

  private encryptSecret(secret: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':');
  }

  private decryptSecret(encrypted: string): string {
    const [ivB64, authTagB64, dataB64] = encrypted.split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(data).toString('utf8') + decipher.final('utf8');
  }
}
