import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    required: false,
    example: 'John Doe',
    description: 'New user name',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    required: false,
    example: 'A short bio about the user.',
    description: 'User biography',
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({
    required: false,
    example: 'https://example.com/avatar.png',
    description: 'URL to new profile picture',
  })
  @IsString()
  @IsOptional()
  picture?: string;
}
