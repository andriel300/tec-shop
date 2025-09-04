import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { IsNotEmpty } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the user',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'test@example.com',
    description: 'The email of the user',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Str0ngP@ssw0rd!',
    description: 'The password of the user',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
}
