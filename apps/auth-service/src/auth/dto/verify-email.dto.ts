import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the user',
  })
  @IsString()
  name: string;

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

  @ApiProperty({
    example: 'Str0ngP@ssw0rd!',
    description: 'The password of the user',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
}
