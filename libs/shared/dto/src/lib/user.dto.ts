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
