import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserProfileDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  picture?: string;
}
