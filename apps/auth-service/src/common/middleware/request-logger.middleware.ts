import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('AuthServiceRequest');

  use(req: Request, res: Response, next: NextFunction) {
    this.logger.log(`Incoming Request: ${req.method} ${req.url}`);
    if (req.body) {
      this.logger.log(`Request Body: ${JSON.stringify(req.body)}`);
    }
    next();
  }
}