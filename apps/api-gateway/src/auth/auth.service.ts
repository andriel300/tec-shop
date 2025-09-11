import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  private readonly authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL') || 'http://localhost:6001';
  }

  async proxyRequest(method: string, path: string, data?: any, headers?: any): Promise<any> {
    try {
      const url = `${this.authServiceUrl}${path}`;
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url,
          data,
          headers,
        }),
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);
      } else if (error.request) {
        throw new HttpException('No response received from auth service', HttpStatus.SERVICE_UNAVAILABLE);
      } else {
        throw new HttpException('Error setting up request to auth service', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
}