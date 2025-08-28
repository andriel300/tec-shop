import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

// This decorator groups all auth-related endpoints under the 'Auth' tag in the Swagger UI.
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  // This controller is for documentation purposes only.
  // The actual request is handled by the auth-service.

  @Get()
  // This provides a description for the endpoint in the Swagger UI.
  @ApiOperation({ summary: 'Get a test message from the auth service' })
  getHelloApi(): void {
    // No implementation is needed here. The http-proxy-middleware intercepts this request
    // and forwards it to the auth-service before this method would be called.
    return;
  }
}
