import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class GenerateOtpDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address to which the OTP will be sent.',
  })
  @IsEmail()
  email: string;
}
