import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UserProfileService } from './user-profile.service';
import { UserController } from './user.controller';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserProfileService],
  exports: [UserProfileService],
})
export class UserModule {}
