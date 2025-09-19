import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, MinLength, Length } from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'test@example.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password (min 8 characters)',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'test@example.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'test@example.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 characters long' })
  otp!: string;
}
