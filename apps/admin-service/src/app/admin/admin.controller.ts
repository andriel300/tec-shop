import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AdminService } from './admin.service';
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
  constructor(private readonly adminService: AdminService) {}

  // ============ User Management Message Patterns ============

  @MessagePattern('admin.listUsers')
  listUsers(@Payload() dto: ListUsersDto) {
    return this.adminService.listUsers(dto);
  }

  @MessagePattern('admin.getUserDetails')
  getUserDetails(@Payload() userId: string) {
    return this.adminService.getUserDetails(userId);
  }

  @MessagePattern('admin.banUser')
  banUser(@Payload() payload: { userId: string; dto: BanUserDto }) {
    return this.adminService.banUser(payload.userId, payload.dto);
  }

  @MessagePattern('admin.unbanUser')
  unbanUser(@Payload() userId: string) {
    return this.adminService.unbanUser(userId);
  }

  // ============ Admin Team Management Message Patterns ============

  @MessagePattern('admin.listAdmins')
  listAdmins() {
    return this.adminService.listAdmins();
  }

  @MessagePattern('admin.createAdmin')
  createAdmin(@Payload() dto: CreateAdminDto) {
    return this.adminService.createAdmin(dto);
  }

  @MessagePattern('admin.deleteAdmin')
  deleteAdmin(@Payload() adminId: string) {
    return this.adminService.deleteAdmin(adminId);
  }

  // ============ Seller Management Message Patterns ============

  @MessagePattern('admin.listSellers')
  listSellers(@Payload() dto: ListSellersDto) {
    return this.adminService.listSellers(dto);
  }

  @MessagePattern('admin.updateSellerVerification')
  updateSellerVerification(
    @Payload() payload: { sellerId: string; dto: UpdateSellerVerificationDto }
  ) {
    return this.adminService.updateSellerVerification(
      payload.sellerId,
      payload.dto
    );
  }

  // ============ Order Management Message Patterns ============

  @MessagePattern('admin.listAllOrders')
  listAllOrders(@Payload() dto: ListOrdersDto) {
    return this.adminService.listAllOrders(dto);
  }

  // ============ Statistics Message Patterns ============

  @MessagePattern('admin.getStatistics')
  getStatistics() {
    return this.adminService.getStatistics();
  }

  // ============ Site Layout Message Patterns ============

  @MessagePattern('admin.getLayout')
  getLayout() {
    return this.adminService.getLayout();
  }

  @MessagePattern('admin.updateLayout')
  updateLayout(@Payload() dto: UpdateLayoutDto) {
    return this.adminService.updateLayout(dto);
  }

  // ============ Hero Slide Message Patterns ============

  @MessagePattern('admin.createHeroSlide')
  createHeroSlide(@Payload() dto: CreateHeroSlideDto) {
    return this.adminService.createHeroSlide(dto);
  }

  @MessagePattern('admin.updateHeroSlide')
  updateHeroSlide(@Payload() payload: { slideId: string; dto: UpdateHeroSlideDto }) {
    return this.adminService.updateHeroSlide(payload.slideId, payload.dto);
  }

  @MessagePattern('admin.deleteHeroSlide')
  deleteHeroSlide(@Payload() slideId: string) {
    return this.adminService.deleteHeroSlide(slideId);
  }

  @MessagePattern('admin.reorderHeroSlides')
  reorderHeroSlides(@Payload() dto: ReorderHeroSlidesDto) {
    return this.adminService.reorderHeroSlides(dto.slideIds);
  }
}
