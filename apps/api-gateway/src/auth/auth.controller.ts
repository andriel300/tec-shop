/* eslint-disable no-useless-catch */
import {
  Controller,
  Req,
  Res,
  Body,
  Post,
  Get,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(res: Response, result: any) {
    if (result && result.accessToken) {
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        path: '/',
      });
    }
    if (result && result.refreshToken) {
      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        path: '/',
      });
    }
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  @Post('register')
  async register(@Body() body: any, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.proxyRequest(req.method, req.url, body, req.headers);
    return result;
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: any, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.proxyRequest(req.method, req.url, body, req.headers);
    this.setAuthCookies(res, result);
    return result;
  }

  @Post('login/email')
  async login(@Body() body: any, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.proxyRequest(req.method, req.url, body, req.headers);
    this.setAuthCookies(res, result);
    return result;
  }

  @Post('refresh')
  async refresh(@Body() body: any, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.proxyRequest(req.method, req.url, body, req.headers);
    this.setAuthCookies(res, result);
    return result;
  }

  @Post('logout')
  async logout(@Headers('authorization') authorization: string, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.proxyRequest(req.method, req.url, {}, req.headers);
    this.clearAuthCookies(res);
    return result;
  }

  @Get('me')
  async getMe(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.proxyRequest(req.method, req.url, {}, req.headers);
    return result;
  }

  @Get('login/google')
  async googleLogin(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.proxyRequest(req.method, req.url, {}, req.headers);
    return result;
  }

  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.proxyRequest(req.method, req.url, {}, req.headers);
    this.setAuthCookies(res, result);
    return result;
  }

  @Post('otp/generate')
  async generateOtp(@Body() body: any, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.proxyRequest(req.method, req.url, body, req.headers);
    return result;
  }

  @Post('otp/verify')
  async verifyOtp(@Body() body: any, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.proxyRequest(req.method, req.url, body, req.headers);
    this.setAuthCookies(res, result);
    return result;
  }

  @Post('password/request-reset')
  async requestPasswordReset(@Body() body: any, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.proxyRequest(req.method, req.url, body, req.headers);
    return result;
  }

  @Post('password/reset')
  async resetPassword(@Body() body: any, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.proxyRequest(req.method, req.url, body, req.headers);
    return result;
  }

  @Get('admin-only')
  async adminOnly(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.proxyRequest(req.method, req.url, {}, req.headers);
    return result;
  }
}