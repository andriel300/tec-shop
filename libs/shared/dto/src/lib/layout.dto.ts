import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export interface UpdateLayoutDto {
  logo?: string;
  banner?: string;
}

export interface HeroSlideResponseDto {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  actionUrl: string | null;
  actionLabel: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LayoutResponseDto {
  id: string;
  logo: string | null;
  banner: string | null;
  heroSlides?: HeroSlideResponseDto[];
  updatedAt: string;
}

export class CreateHeroSlideDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsString()
  @IsNotEmpty()
  imageUrl!: string;

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsString()
  actionLabel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateHeroSlideDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsString()
  actionLabel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ReorderHeroSlidesDto {
  @IsArray()
  @IsString({ each: true })
  slideIds!: string[];
}
