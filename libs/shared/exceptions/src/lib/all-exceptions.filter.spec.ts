import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { Response, Request } from 'express';
import { PrismaClientValidationError } from '@prisma/client/runtime/library';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockRequest = {
      url: '/test',
      method: 'GET',
    };
    mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse as Response,
        getRequest: () => mockRequest as Request,
      }),
    } as ArgumentsHost;
  });

  it('should catch HttpException and return appropriate response', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Not Found',
        path: '/test',
      })
    );
  });

  it('should catch PrismaClientValidationError and return BAD_REQUEST', () => {
    // Create a mock PrismaClientValidationError instance
    class MockPrismaClientValidationError extends Error {
      name = 'PrismaClientValidationError';
      constructor(message: string) {
        super(message);
      }
    }
    const exception = new MockPrismaClientValidationError('Invalid data');
    Object.setPrototypeOf(exception, PrismaClientValidationError.prototype); // Make it an instance of PrismaClientValidationError

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid data provided to the database.',
        path: '/test',
      })
    );
  });

  it('should catch generic Error and return INTERNAL_SERVER_ERROR', () => {
    const exception = new Error('Something went wrong');
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Something went wrong',
        path: '/test',
      })
    );
  });

  it('should catch unknown exception and return INTERNAL_SERVER_ERROR', () => {
    const exception = 'Unknown error type';
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        path: '/test',
      })
    );
  });
});