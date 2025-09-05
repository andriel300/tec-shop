import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetDto {
  @ApiProperty({
    example: 'user@example.com',
    description: "User's email address",
  })
  @IsEmail()
  email!: string;
}
