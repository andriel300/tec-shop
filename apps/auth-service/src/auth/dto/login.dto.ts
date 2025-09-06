import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'test@example.com',
    description: 'The email of the user',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Str0ngP@ssw0rd!',
    description: 'The password of the user',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
