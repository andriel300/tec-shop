/* eslint-disable no-useless-catch */
import { Controller, All, Req, Res, Body, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @All('*') // Catch all HTTP methods and paths under /auth
  async proxyAuthRequests(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: any
  ) {
    const method = req.method;
    const headers = req.headers;

    // Remove host and connection headers as they are handled by httpService
    delete headers['host'];
    delete headers['connection'];

    try {
      const result = await this.authService.proxyRequest(
        method,
        req.url, // Use the full incoming URL as the path for the auth-service
        body,
        headers
      );

      // This part is specific to login/token endpoints.
      // If you have other endpoints that don't return tokens,
      // you might need more sophisticated logic or separate controllers.
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

      return result;
    } catch (error) {
      // Re-throw the HttpException from AuthService to maintain status codes
      throw error;
    }
  }
}
