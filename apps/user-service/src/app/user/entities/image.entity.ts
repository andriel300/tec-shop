export enum ImageType {
  AVATAR = 'AVATAR',
  COVER = 'COVER',
  GALLERY = 'GALLERY',
}

export class Image {
  id!: string;
  file_id!: string;
  url!: string;
  imageType!: ImageType;
  userProfileId!: string;
  createdAt!: Date;
}
