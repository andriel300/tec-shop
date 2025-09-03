import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address used to request the OTP.',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'The 6-digit OTP received via email.',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  otp: string;
}
