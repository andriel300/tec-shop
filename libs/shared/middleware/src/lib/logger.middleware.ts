import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// This class is a middleware, meaning it runs on every request before it
// reaches your route handlers. Think of it as the app's receptionist,
// logging everyone who comes in and how long their visit took.
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Grabs the essential details from the incoming request as soon as it arrives.
    const { method, originalUrl } = req;
    // Starts a timer to measure how long the request takes to process.
    // This is like noting the exact time a customer walks in.
    const start = Date.now();

    // We don't log here immediately. Instead, we set up a listener on the
    // response's 'finish' event. This is the key – it means we wait until
    // the entire request/response cycle is complete, including the time it
    // takes for the route handler to do its job. This gives us the full picture.
    res.on('finish', () => {
      const duration = Date.now() - start;

      // This simple line is a goldmine for performance monitoring and debugging weird issues.
      console.log(
        `[${method}] ${originalUrl} - ${res.statusCode} - ${duration}ms`
      );
    });

    // This is critical! It passes the request to the next middleware
    // or the final route handler. Forgetting this would hang the entire app.
    next();
  }
}
