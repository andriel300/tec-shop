import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsBoolean,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============ User Management DTOs ============

export class ListUsersDto {
  @ApiProperty({ example: 1, description: 'Page number', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ example: 10, description: 'Items per page', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ example: 'john@example.com', description: 'Search by email or name', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: 'CUSTOMER', description: 'Filter by user type', required: false, enum: ['CUSTOMER', 'SELLER', 'ADMIN'] })
  @IsOptional()
  @IsEnum(['CUSTOMER', 'SELLER', 'ADMIN'])
  userType?: 'CUSTOMER' | 'SELLER' | 'ADMIN';

  @ApiProperty({ example: 'ACTIVE', description: 'Filter by status', required: false, enum: ['ACTIVE', 'BANNED'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'BANNED'])
  status?: 'ACTIVE' | 'BANNED';
}

export class BanUserDto {
  @ApiProperty({ example: 'Violation of terms of service' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiProperty({ example: 30, description: 'Ban duration in days (0 = permanent)', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number;
}

export class UnbanUserDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'User ID to unban' })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}

// ============ Admin Team Management DTOs ============

export class CreateAdminDto {
  @ApiProperty({ example: 'admin@tec-shop.com', description: 'Admin email address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Admin Name', description: 'Admin full name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Admin password (min 8 chars, must contain uppercase, lowercase, number and special character)'
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character (@$!%*?&)',
  })
  password!: string;
}

export class DeleteAdminDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Admin ID to delete' })
  @IsString()
  @IsNotEmpty()
  adminId!: string;
}

// ============ Seller Management DTOs ============

export class ListSellersDto {
  @ApiProperty({ example: 1, description: 'Page number', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ example: 10, description: 'Items per page', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ example: 'seller@example.com', description: 'Search by email or name', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: true, description: 'Filter by verification status', required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVerified?: boolean;
}

export class UpdateSellerVerificationDto {
  @ApiProperty({ example: true, description: 'Verification status' })
  @IsBoolean()
  isVerified!: boolean;

  @ApiProperty({ example: 'Verified after document review', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

// ============ Order Management DTOs ============

export class ListOrdersDto {
  @ApiProperty({ example: 1, description: 'Page number', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ example: 10, description: 'Items per page', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ example: 'PAID', description: 'Filter by order status', required: false, enum: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
  status?: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

  @ApiProperty({ example: 'COMPLETED', description: 'Filter by payment status', required: false, enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'])
  paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

  @ApiProperty({ example: '2024-01-01', description: 'Start date for filtering', required: false })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ example: '2024-12-31', description: 'End date for filtering', required: false })
  @IsOptional()
  @IsString()
  endDate?: string;
}

// ============ Legacy DTOs (for backward compatibility) ============

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  role?: string; // e.g., ADMIN, USER
}

export class UpdateRoleDto {
  @IsString()
  @IsNotEmpty()
  id!: string; // user id

  @IsString()
  @IsNotEmpty()
  role!: string; // new role
}

export class DeleteUserDto {
  @IsString()
  @IsNotEmpty()
  id!: string;
}
