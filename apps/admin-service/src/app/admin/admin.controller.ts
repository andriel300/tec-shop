import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AdminUsersService } from './admin-users.service';
import { AdminSellersService } from './admin-sellers.service';
import { AdminOrdersService } from './admin-orders.service';
import { AdminLayoutService } from './admin-layout.service';
import type {
  ListUsersDto,
  BanUserDto,
  CreateAdminDto,
  ListSellersDto,
  UpdateSellerVerificationDto,
  ListOrdersDto,
  UpdateLayoutDto,
  CreateHeroSlideDto,
  UpdateHeroSlideDto,
  ReorderHeroSlidesDto,
} from '@tec-shop/dto';

@Controller()
export class AdminController {
  constructor(
    private readonly usersService: AdminUsersService,
    private readonly sellersService: AdminSellersService,
    private readonly ordersService: AdminOrdersService,
    private readonly layoutService: AdminLayoutService,
  ) {}

  // ============ User Management Message Patterns ============

  @MessagePattern('admin.listUsers')
  listUsers(@Payload() dto: ListUsersDto) {
    return this.usersService.listUsers(dto);
  }

  @MessagePattern('admin.getUserDetails')
  getUserDetails(@Payload() userId: string) {
    return this.usersService.getUserDetails(userId);
  }

  @MessagePattern('admin.banUser')
  banUser(@Payload() payload: { userId: string; dto: BanUserDto }) {
    return this.usersService.banUser(payload.userId, payload.dto);
  }

  @MessagePattern('admin.unbanUser')
  unbanUser(@Payload() userId: string) {
    return this.usersService.unbanUser(userId);
  }

  // ============ Admin Team Management Message Patterns ============

  @MessagePattern('admin.listAdmins')
  listAdmins() {
    return this.usersService.listAdmins();
  }

  @MessagePattern('admin.createAdmin')
  createAdmin(@Payload() dto: CreateAdminDto) {
    return this.usersService.createAdmin(dto);
  }

  @MessagePattern('admin.deleteAdmin')
  deleteAdmin(
    @Payload() payload: { adminId: string; confirmPassword: string; requestingAdminId: string }
  ) {
    return this.usersService.deleteAdmin(
      payload.adminId,
      payload.confirmPassword,
      payload.requestingAdminId
    );
  }

  // ============ Seller Management Message Patterns ============

  @MessagePattern('admin.listSellers')
  listSellers(@Payload() dto: ListSellersDto) {
    return this.sellersService.listSellers(dto);
  }

  @MessagePattern('admin.updateSellerVerification')
  updateSellerVerification(
    @Payload() payload: { sellerId: string; dto: UpdateSellerVerificationDto }
  ) {
    return this.sellersService.updateSellerVerification(payload.sellerId, payload.dto);
  }

  // ============ Order Management Message Patterns ============

  @MessagePattern('admin.listAllOrders')
  listAllOrders(@Payload() dto: ListOrdersDto) {
    return this.ordersService.listAllOrders(dto);
  }

  // ============ Statistics Message Patterns ============

  @MessagePattern('admin.getPendingCounts')
  getPendingCounts() {
    return this.ordersService.getPendingCounts();
  }

  @MessagePattern('admin.getStatistics')
  getStatistics() {
    return this.ordersService.getStatistics();
  }

  // ============ Site Layout Message Patterns ============

  @MessagePattern('admin.getLayout')
  getLayout() {
    return this.layoutService.getLayout();
  }

  @MessagePattern('admin.updateLayout')
  updateLayout(@Payload() dto: UpdateLayoutDto) {
    return this.layoutService.updateLayout(dto);
  }

  // ============ Hero Slide Message Patterns ============

  @MessagePattern('admin.createHeroSlide')
  createHeroSlide(@Payload() dto: CreateHeroSlideDto) {
    return this.layoutService.createHeroSlide(dto);
  }

  @MessagePattern('admin.updateHeroSlide')
  updateHeroSlide(@Payload() payload: { slideId: string; dto: UpdateHeroSlideDto }) {
    return this.layoutService.updateHeroSlide(payload.slideId, payload.dto);
  }

  @MessagePattern('admin.deleteHeroSlide')
  deleteHeroSlide(@Payload() slideId: string) {
    return this.layoutService.deleteHeroSlide(slideId);
  }

  @MessagePattern('admin.reorderHeroSlides')
  reorderHeroSlides(@Payload() dto: ReorderHeroSlidesDto) {
    return this.layoutService.reorderHeroSlides(dto.slideIds);
  }
}
