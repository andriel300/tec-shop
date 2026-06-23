import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UserProfileService } from './user-profile.service';

@Module({
  imports: [PrismaModule],
  providers: [UserProfileService],
  exports: [UserProfileService],
})
export class UserModule {}
