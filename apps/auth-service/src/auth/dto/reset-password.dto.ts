import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: "User's email address",
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
    description: 'Password reset token',
  })
  @IsString()
  token!: string;

  @ApiProperty({
    example: 'NewSecurePassword123',
    description: 'New password (min 8 characters)',
  })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
