import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  UpdateUserDto,
  CreateUserProfileDto,
  CreateShippingAddressDto,
  UpdateShippingAddressDto,
} from '@tec-shop/dto';

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

  // Shipping Address Message Patterns
  @MessagePattern('create-shipping-address')
  createShippingAddress(
    @Payload() payload: { userId: string; data: CreateShippingAddressDto }
  ) {
    return this.appService.createShippingAddress(payload.userId, payload.data);
  }

  @MessagePattern('get-shipping-addresses')
  getShippingAddresses(@Payload() userId: string) {
    return this.appService.getShippingAddresses(userId);
  }

  @MessagePattern('get-shipping-address')
  getShippingAddress(@Payload() payload: { userId: string; addressId: string }) {
    return this.appService.getShippingAddress(payload.userId, payload.addressId);
  }

  @MessagePattern('update-shipping-address')
  updateShippingAddress(
    @Payload()
    payload: {
      userId: string;
      addressId: string;
      data: UpdateShippingAddressDto;
    }
  ) {
    return this.appService.updateShippingAddress(
      payload.userId,
      payload.addressId,
      payload.data
    );
  }

  @MessagePattern('delete-shipping-address')
  deleteShippingAddress(
    @Payload() payload: { userId: string; addressId: string }
  ) {
    return this.appService.deleteShippingAddress(payload.userId, payload.addressId);
  }

  @MessagePattern('set-default-shipping-address')
  setDefaultShippingAddress(
    @Payload() payload: { userId: string; addressId: string }
  ) {
    return this.appService.setDefaultShippingAddress(
      payload.userId,
      payload.addressId
    );
  }

  @MessagePattern('copy-shipping-address')
  copyShippingAddress(
    @Payload() payload: { userId: string; addressId: string }
  ) {
    return this.appService.copyShippingAddress(payload.userId, payload.addressId);
  }

  // Shop Follow Message Patterns
  @MessagePattern('user-follow-shop')
  followShop(@Payload() payload: { userId: string; shopId: string }) {
    return this.appService.followShop(payload.userId, payload.shopId);
  }

  @MessagePattern('user-unfollow-shop')
  unfollowShop(@Payload() payload: { userId: string; shopId: string }) {
    return this.appService.unfollowShop(payload.userId, payload.shopId);
  }

  @MessagePattern('user-get-shop-followers-count')
  getShopFollowersCount(@Payload() shopId: string) {
    return this.appService.getShopFollowersCount(shopId);
  }

  @MessagePattern('user-check-shop-follow')
  checkUserFollowsShop(@Payload() payload: { userId: string; shopId: string }) {
    return this.appService.checkUserFollowsShop(payload.userId, payload.shopId);
  }

  @MessagePattern('user-get-followed-shops')
  getUserFollowedShops(@Payload() userId: string) {
    return this.appService.getUserFollowedShops(userId);
  }
}
