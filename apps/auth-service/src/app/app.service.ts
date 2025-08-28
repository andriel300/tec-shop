import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return ({ message: 'Hello API test from auth service/src/app/app.service.ts' });
  }
}
