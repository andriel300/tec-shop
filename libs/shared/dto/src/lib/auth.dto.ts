import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  Matches,
  IsBoolean,
  IsOptional,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

// Custom validator for password confirmation
export function IsPasswordMatch(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPasswordMatch',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as Record<string, unknown>)[relatedPropertyName];
          return value === relatedValue;
        },
        defaultMessage(_args: ValidationArguments) {
          return 'Password confirmation must match password';
        },
      },
    });
  };
}

export class SignupDto {
  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'test@example.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    description:
      'User password (min 8 chars, must contain uppercase, lowercase, number and special character)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character (@$!%*?&)',
  })
  password!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Password confirmation (must match password)',
  })
  @IsString()
  @MinLength(8)
  @IsPasswordMatch('password')
  confirmPassword!: string;

  @ApiProperty({
    example: true,
    description: 'Whether the user accepted the terms of service',
  })
  @IsBoolean()
  termsAccepted!: boolean;
}

export class SellerSignupDto {
  @ApiProperty({ example: 'John Doe', description: 'Seller full name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'seller@example.com', description: 'Seller email' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number with country code'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+\d{1,4}\d{7,15}$/, {
    message: 'Phone number must be in international format (+country code + number)'
  })
  phoneNumber!: string;

  @ApiProperty({
    example: 'US',
    description: 'Country code (ISO 3166-1 alpha-2)'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2}$/, {
    message: 'Country must be a valid 2-letter country code'
  })
  country!: string;

  @ApiProperty({
    example: 'Password123!',
    description:
      'Seller password (min 8 chars, must contain uppercase, lowercase, number and special character)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character (@$!%*?&)',
  })
  password!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Password confirmation (must match password)',
  })
  @IsString()
  @MinLength(8)
  @IsPasswordMatch('password')
  confirmPassword!: string;

  @ApiProperty({
    example: true,
    description: 'Whether the seller accepted the terms of service',
  })
  @IsBoolean()
  termsAccepted!: boolean;
}

export class LoginDto {
  @ApiProperty({ example: 'test@example.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123!', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({
    example: false,
    description: 'Keep user logged in for extended period',
    required: false
  })
  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'test@example.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'OTP must be exactly 6 digits' })
  otp!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'test@example.com', description: 'User email' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'abc123-def456-ghi789',
    description: 'Password reset token from email link'
  })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description:
      'New password (min 8 chars, must contain uppercase, lowercase, number and special character)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character (@$!%*?&)',
  })
  newPassword!: string;
}

// Keep the old DTO for backward compatibility during transition
export class ResetPasswordWithCodeDto {
  @ApiProperty({ example: 'test@example.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456', description: '6-digit reset code' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'Reset code must be exactly 6 digits' })
  code!: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description:
      'New password (min 8 chars, must contain uppercase, lowercase, number and special character)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character (@$!%*?&)',
  })
  newPassword!: string;
}

export class ValidateResetTokenDto {
  @ApiProperty({
    example: 'abc123-def456-ghi789',
    description: 'Password reset token to validate'
  })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
