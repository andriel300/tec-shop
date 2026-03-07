import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import CircuitBreaker from 'opossum';

const BREAKER_OPTIONS: CircuitBreaker.Options = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 5,
};

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly breakers = new Map<
    string,
    CircuitBreaker<[() => Promise<unknown>], unknown>
  >();

  private getBreaker(
    serviceName: string,
  ): CircuitBreaker<[() => Promise<unknown>], unknown> {
    if (!this.breakers.has(serviceName)) {
      const action = (fn: () => Promise<unknown>) => fn();
      const breaker = new CircuitBreaker(action, BREAKER_OPTIONS);

      breaker.on('open', () =>
        this.logger.warn(`Circuit [${serviceName}] OPENED - service unavailable`),
      );
      breaker.on('halfOpen', () =>
        this.logger.log(`Circuit [${serviceName}] HALF-OPEN - probing service`),
      );
      breaker.on('close', () =>
        this.logger.log(`Circuit [${serviceName}] CLOSED - service recovered`),
      );

      this.breakers.set(serviceName, breaker);
    }
    return this.breakers.get(serviceName)!;
  }

  async fire<T>(serviceName: string, fn: () => Promise<T>): Promise<T> {
    const breaker = this.getBreaker(serviceName);
    try {
      return (await breaker.fire(fn as () => Promise<unknown>)) as T;
    } catch (error) {
      if (breaker.opened) {
        // Log the internal service name but do not expose it to the client
        this.logger.warn(`Circuit open for ${serviceName} — returning 503 to client`);
        throw new ServiceUnavailableException(
          'Service temporarily unavailable. Please try again later.',
        );
      }
      throw error;
    }
  }
}
