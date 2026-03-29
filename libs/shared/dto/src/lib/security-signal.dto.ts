import {
  IsEnum,
  IsObject,
  IsOptional,
  ValidateIf,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export enum SecuritySignalType {
  DEVTOOLS_OPEN = 'devtools_open',
  BOT_DETECTED = 'bot_detected',
  AUTOMATION_DETECTED = 'automation_detected',
}

/**
 * Validates that an object has at most `maxKeys` keys and all values are
 * scalars (string | number | boolean | null). Rejects nested objects/arrays
 * to prevent payload amplification or prototype-pollution vectors.
 */
function IsScalarRecord(maxKeys: number, options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isScalarRecord',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      target: (object as { constructor: Function }).constructor,
      propertyName,
      constraints: [maxKeys],
      options,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (value === null || value === undefined) return true;
          if (typeof value !== 'object' || Array.isArray(value)) return false;
          const entries = Object.entries(value as Record<string, unknown>);
          const [limit] = args.constraints as [number];
          if (entries.length > limit) return false;
          return entries.every(([, v]) => {
            const t = typeof v;
            return v === null || t === 'string' || t === 'number' || t === 'boolean';
          });
        },
        defaultMessage(args: ValidationArguments): string {
          const [limit] = args.constraints as [number];
          return `${args.property} must have at most ${limit} keys with scalar values (string, number, boolean, or null)`;
        },
      },
    });
  };
}

export class SecuritySignalDto {
  @IsEnum(SecuritySignalType)
  type!: SecuritySignalType;

  @IsOptional()
  @IsObject()
  @ValidateIf((o: SecuritySignalDto) => o.metadata !== undefined)
  @IsScalarRecord(10)
  metadata?: Record<string, string | number | boolean | null>;
}
