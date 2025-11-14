import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateUserProfileDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  picture?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  picture?: string;
}

export enum ImageType {
  AVATAR = 'AVATAR',
  COVER = 'COVER',
  GALLERY = 'GALLERY',
}

export class CreateImageDto {
  @IsString()
  @IsNotEmpty()
  file_id!: string;

  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsEnum(ImageType)
  @IsOptional()
  imageType?: ImageType;

  @IsString()
  @IsNotEmpty()
  userProfileId!: string;
}

export class FollowUserDto {
  @IsString()
  @IsNotEmpty()
  followingId!: string;
}

export class CreateShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  label!: string; // Home, Work, Others

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  street!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsNotEmpty()
  zipCode!: string;

  @IsString()
  @IsNotEmpty()
  country!: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsOptional()
  isDefault?: boolean;
}

export class UpdateShippingAddressDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  zipCode?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsOptional()
  isDefault?: boolean;
}
