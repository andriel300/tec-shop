import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getUserProfile(userId: string) {
    return this.prisma.users.findUnique({
      where: { id: userId },
    });
  }

  async updateUserProfile(userId: string, data: UpdateUserDto) {
    return this.prisma.users.update({
      where: { id: userId },
      data,
    });
  }

  async createUserProfile(data: CreateUserProfileDto) {
    const { userId, email, name } = data;
    return this.prisma.users.create({
      data: {
        id: userId,
        email,
        name,
      },
    });
  }
}
