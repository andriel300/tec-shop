import { Injectable } from '@nestjs/common';
import { UserPrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';

@Injectable()
export class AppService {
  constructor(private prisma: UserPrismaService) {}

  async getUserProfile(userId: string) {
    return this.prisma.userProfile.findUnique({
      where: { userId: userId },
    });
  }

  async updateUserProfile(userId: string, data: UpdateUserDto) {
    return this.prisma.userProfile.update({
      where: { userId: userId },
      data,
    });
  }

  async createUserProfile(data: CreateUserProfileDto) {
    const { userId, email, name } = data;
    return this.prisma.userProfile.create({
      data: {
        userId,
        email,
        name,
      },
    });
  }
}
