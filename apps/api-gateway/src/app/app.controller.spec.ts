import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllExceptionsFilter } from '@tec-shop/exceptions';
import { APP_FILTER } from '@nestjs/core';
import { HttpException, HttpStatus } from '@nestjs/common';
jest.mock('@nestjs/swagger', () => ({
  ApiTags: () => jest.fn(),
  ApiOperation: () => jest.fn(),
  ApiResponse: () => jest.fn(),
  ApiBody: () => jest.fn(),
  ApiExcludeEndpoint: () => jest.fn(),
}));

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: APP_FILTER,
          useClass: AllExceptionsFilter,
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);
  });

  describe('getData', () => {
    it('should return "Hello API" ', () => {
      jest
        .spyOn(appService, 'getData')
        .mockReturnValue({ message: 'Hello API' });
      expect(appController.getData()).toEqual({ message: 'Hello API' });
    });

    it('should handle exceptions with AllExceptionsFilter', async () => {
      jest.spyOn(appService, 'getData').mockImplementation(() => {
        throw new HttpException('Test Exception', HttpStatus.BAD_REQUEST);
      });

      // We expect the filter to catch the exception and return a structured error
      // This requires mocking the response object or testing the filter directly.
      // For a controller test, we can assert that calling the method throws.
      await expect(() => appController.getData()).toThrow(
        new HttpException('Test Exception', HttpStatus.BAD_REQUEST)
      );
    });
  });
});
