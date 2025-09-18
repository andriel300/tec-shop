
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 characters long' })
  otp: string;
}
