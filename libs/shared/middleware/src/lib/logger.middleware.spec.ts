import { LoggerMiddleware } from './logger.middleware';
import { Request, Response, NextFunction } from 'express';

describe('LoggerMiddleware', () => {
  let middleware: LoggerMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    middleware = new LoggerMiddleware();
    mockRequest = {
      method: 'GET',
      originalUrl: '/test',
    };
    mockResponse = {
      on: jest.fn((event, cb) => {
        if (event === 'finish') {
          // Simulate the finish event
          cb();
        }
      }),
      statusCode: 200,
    };
    mockNext = jest.fn();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {}); // Mock console.log
  });

  afterEach(() => {
    consoleSpy.mockRestore(); // Restore console.log after each test
  });

  it('should call next()', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should log request details on finish', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    // Simulate the 'finish' event being triggered by the response
    // This is handled by the mockResponse.on setup in beforeEach

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(`[${mockRequest.method}] ${mockRequest.originalUrl}`)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(`${mockResponse.statusCode}`)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(`ms`)
    );
  });
});