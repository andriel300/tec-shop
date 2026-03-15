import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  UpdateUserDto,
  CreateUserProfileDto,
  CreateShippingAddressDto,
  UpdateShippingAddressDto,
} from '@tec-shop/dto';
import { UserProfileService } from './user-profile.service';
import { ShopFollowService } from './shop-follow.service';
import { ShippingAddressService } from './shipping-address.service';

@Controller()
export class AppController {
  constructor(
    private readonly userProfileService: UserProfileService,
    private readonly shopFollowService: ShopFollowService,
    private readonly shippingAddressService: ShippingAddressService,
  ) {}

  @MessagePattern('get-user-profile')
  getUserProfile(@Payload() userId: string) {
    return this.userProfileService.getUserProfile(userId);
  }

  @MessagePattern('update-user-profile')
  updateUserProfile(
    @Payload() payload: { userId: string; data: UpdateUserDto }
  ) {
    return this.userProfileService.updateUserProfile(payload.userId, payload.data);
  }

  @MessagePattern('create-user-profile')
  createUserProfile(@Payload() data: CreateUserProfileDto) {
    return this.userProfileService.createUserProfile(data);
  }

  // Shipping Address Message Patterns
  @MessagePattern('create-shipping-address')
  createShippingAddress(
    @Payload() payload: { userId: string; data: CreateShippingAddressDto }
  ) {
    return this.shippingAddressService.createShippingAddress(payload.userId, payload.data);
  }

  @MessagePattern('get-shipping-addresses')
  getShippingAddresses(@Payload() userId: string) {
    return this.shippingAddressService.getShippingAddresses(userId);
  }

  @MessagePattern('get-shipping-address')
  getShippingAddress(@Payload() payload: { userId: string; addressId: string }) {
    return this.shippingAddressService.getShippingAddress(payload.userId, payload.addressId);
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
    return this.shippingAddressService.updateShippingAddress(
      payload.userId,
      payload.addressId,
      payload.data
    );
  }

  @MessagePattern('delete-shipping-address')
  deleteShippingAddress(
    @Payload() payload: { userId: string; addressId: string }
  ) {
    return this.shippingAddressService.deleteShippingAddress(payload.userId, payload.addressId);
  }

  @MessagePattern('set-default-shipping-address')
  setDefaultShippingAddress(
    @Payload() payload: { userId: string; addressId: string }
  ) {
    return this.shippingAddressService.setDefaultShippingAddress(
      payload.userId,
      payload.addressId
    );
  }

  @MessagePattern('copy-shipping-address')
  copyShippingAddress(
    @Payload() payload: { userId: string; addressId: string }
  ) {
    return this.shippingAddressService.copyShippingAddress(payload.userId, payload.addressId);
  }

  // Shop Follow Message Patterns
  @MessagePattern('user-follow-shop')
  followShop(@Payload() payload: { userId: string; shopId: string }) {
    return this.shopFollowService.followShop(payload.userId, payload.shopId);
  }

  @MessagePattern('user-unfollow-shop')
  unfollowShop(@Payload() payload: { userId: string; shopId: string }) {
    return this.shopFollowService.unfollowShop(payload.userId, payload.shopId);
  }

  @MessagePattern('user-get-shop-followers-count')
  getShopFollowersCount(@Payload() shopId: string) {
    return this.shopFollowService.getShopFollowersCount(shopId);
  }

  @MessagePattern('user-check-shop-follow')
  checkUserFollowsShop(@Payload() payload: { userId: string; shopId: string }) {
    return this.shopFollowService.checkUserFollowsShop(payload.userId, payload.shopId);
  }

  @MessagePattern('user-get-followed-shops')
  getUserFollowedShops(@Payload() userId: string) {
    return this.shopFollowService.getUserFollowedShops(userId);
  }
}
