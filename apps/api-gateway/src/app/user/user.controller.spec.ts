import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';

describe('UserController', () => {
  let controller: UserController;
  let userServiceClient: ClientProxy;

  const mockRequest = (userId: string) => ({
    user: { userId },
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: 'USER_SERVICE',
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userServiceClient = module.get<ClientProxy>('USER_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should retrieve user profile from user-service', async () => {
      // Arrange
      const userId = 'user-123';
      const req = mockRequest(userId);
      const expectedProfile = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        phoneNumber: '+1234567890',
        address: '123 Main St',
        createdAt: new Date(),
      };

      jest.spyOn(userServiceClient, 'send').mockReturnValue(of(expectedProfile));

      // Act
      const result = await controller.getUserProfile(req);

      // Assert
      expect(userServiceClient.send).toHaveBeenCalledWith('get-user-profile', userId);
      expect(result).toEqual(expectedProfile);
    });

    it('should propagate errors from user-service', async () => {
      // Arrange
      const userId = 'user-123';
      const req = mockRequest(userId);

      jest.spyOn(userServiceClient, 'send').mockReturnValue(
        throwError(() => new Error('User not found'))
      );

      // Act & Assert
      await expect(controller.getUserProfile(req)).rejects.toThrow('User not found');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile via user-service', async () => {
      // Arrange
      const userId = 'user-123';
      const req = mockRequest(userId);
      const updateData = {
        name: 'Updated Name',
        phoneNumber: '+9876543210',
        address: '456 New St',
      };
      const expectedResponse = {
        id: userId,
        ...updateData,
        email: 'test@example.com',
        updatedAt: new Date(),
      };

      jest.spyOn(userServiceClient, 'send').mockReturnValue(of(expectedResponse));

      // Act
      const result = await controller.updateUserProfile(req, updateData);

      // Assert
      expect(userServiceClient.send).toHaveBeenCalledWith('update-user-profile', {
        userId,
        data: updateData,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should handle partial updates', async () => {
      // Arrange
      const userId = 'user-123';
      const req = mockRequest(userId);
      const updateData = { name: 'Only Name Changed' };
      const expectedResponse = {
        id: userId,
        name: 'Only Name Changed',
        email: 'test@example.com',
      };

      jest.spyOn(userServiceClient, 'send').mockReturnValue(of(expectedResponse));

      // Act
      const result = await controller.updateUserProfile(req, updateData);

      // Assert
      expect(userServiceClient.send).toHaveBeenCalledWith('update-user-profile', {
        userId,
        data: updateData,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should propagate validation errors from user-service', async () => {
      // Arrange
      const userId = 'user-123';
      const req = mockRequest(userId);
      const invalidData = { name: 'invalid' };

      jest.spyOn(userServiceClient, 'send').mockReturnValue(
        throwError(() => new Error('Invalid phone number format'))
      );

      // Act & Assert
      await expect(controller.updateUserProfile(req, invalidData)).rejects.toThrow(
        'Invalid phone number format'
      );
    });
  });
});
