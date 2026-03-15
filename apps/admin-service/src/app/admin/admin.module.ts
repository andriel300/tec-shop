import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminSellersService } from './admin-sellers.service';
import { AdminOrdersService } from './admin-orders.service';
import { AdminLayoutService } from './admin-layout.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [
    AdminUsersService,
    AdminSellersService,
    AdminOrdersService,
    AdminLayoutService,
  ],
  exports: [
    AdminUsersService,
    AdminSellersService,
    AdminOrdersService,
    AdminLayoutService,
  ],
})
export class AdminModule {}
