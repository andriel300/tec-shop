import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UpdateUserDto, CreateUserProfileDto } from '@tec-shop/shared/dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('get-user-profile')
  getUserProfile(@Payload() userId: string) {
    return this.appService.getUserProfile(userId);
  }

  @MessagePattern('update-user-profile')
  updateUserProfile(
    @Payload() payload: { userId: string; data: UpdateUserDto }
  ) {
    return this.appService.updateUserProfile(payload.userId, payload.data);
  }

  @MessagePattern('create-user-profile')
  createUserProfile(@Payload() data: CreateUserProfileDto) {
    return this.appService.createUserProfile(data);
  }
}
