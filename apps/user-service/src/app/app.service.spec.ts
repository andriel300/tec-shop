import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { UserPrismaService } from '../prisma/prisma.service';
import { CreateUserProfileDto, UpdateUserDto } from '@tec-shop/dto';

describe('AppService', () => {
  let service: AppService;
  let prisma: UserPrismaService;

  const mockUserProfile = {
    id: 'profile1',
    userId: 'user1',
    name: 'Test User',
    bio: null,
    picture: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: {
      followers: 0,
      following: 0,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: UserPrismaService,
          useValue: {
            userProfile: {
              findUnique: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    prisma = module.get<UserPrismaService>(UserPrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserProfile', () => {
    it('should return a user profile', async () => {
      jest.spyOn(prisma.userProfile, 'findUnique').mockResolvedValue(mockUserProfile);
      const result = await service.getUserProfile('user1');
      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        include: {
          _count: {
            select: {
              followers: true,
              following: true,
            },
          },
        },
      });
      expect(result).toEqual({
        ...mockUserProfile,
        followersCount: 0,
        followingCount: 0,
        _count: undefined,
      });
    });
  });

  describe('updateUserProfile', () => {
    it('should update and return the user profile', async () => {
      const updateData: UpdateUserDto = { name: 'Updated Name' };
      const updatedProfile = { ...mockUserProfile, ...updateData };
      jest.spyOn(prisma.userProfile, 'update').mockResolvedValue(updatedProfile);

      const result = await service.updateUserProfile('user1', updateData);
      expect(prisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        data: updateData,
      });
      expect(result).toEqual(updatedProfile);
    });
  });

  describe('createUserProfile', () => {
    it('should create and return a new user profile', async () => {
      const createData: CreateUserProfileDto = {
        userId: 'user1',
        name: 'Test User',
      };
      jest.spyOn(prisma.userProfile, 'create').mockResolvedValue(mockUserProfile);

      const result = await service.createUserProfile(createData);
      expect(prisma.userProfile.create).toHaveBeenCalledWith({
        data: createData,
      });
      expect(result).toEqual(mockUserProfile);
    });
  });
});