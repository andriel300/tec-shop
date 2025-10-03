import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @MinLength(3, { message: 'Product name must be at least 3 characters' })
  @MaxLength(200, { message: 'Product name must not exceed 200 characters' })
  name: string;

  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  description: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0.01, { message: 'Price must be greater than 0' })
  price: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0, { message: 'Stock cannot be negative' })
  stock: number;

  @IsString()
  @MinLength(2, { message: 'Category is required' })
  category: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class ProductResponseDto {
  id: string;
  shopId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  slug: string | null;
  tags: string[];
  views: number;
  sales: number;
  createdAt: Date;
  updatedAt: Date;
}
