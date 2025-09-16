import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserProfileDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
