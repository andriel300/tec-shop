import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { LoginDto, SignupDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto } from '@tec-shop/dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy
  ) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registration initiated. Check email for OTP.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists.',
  })
  async signup(@Body() signupDto: SignupDto) {
    return await firstValueFrom(
      this.authService.send('auth-signup', signupDto)
    );
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify user email with OTP' })
  @ApiResponse({ status: 201, description: 'Email successfully verified.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP.' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return await firstValueFrom(
      this.authService.send('auth-verify-email', verifyEmailDto)
    );
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in a user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully logged in and returns a JWT token.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(@Body() body: LoginDto) {
    return await firstValueFrom(this.authService.send('auth-login', body));
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 201,
    description: 'Password reset email sent if account exists.',
  })
  @ApiResponse({ status: 400, description: 'Invalid email format.' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await firstValueFrom(
      this.authService.send('auth-forgot-password', forgotPasswordDto)
    );
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({
    status: 201,
    description: 'Password successfully reset.',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired reset token.' })
  @ApiResponse({ status: 400, description: 'Invalid password format.' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await firstValueFrom(
      this.authService.send('auth-reset-password', resetPasswordDto)
    );
  }
}
