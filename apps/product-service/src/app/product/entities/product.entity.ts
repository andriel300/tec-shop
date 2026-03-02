export enum ProductType {
  SIMPLE = 'SIMPLE',
  VARIABLE = 'VARIABLE',
  DIGITAL = 'DIGITAL',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  SCHEDULED = 'SCHEDULED',
}

export enum ProductVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  PASSWORD_PROTECTED = 'PASSWORD_PROTECTED',
}

export class Product {
  id: string;
  shopId: string;
  name: string;
  description: string;
  categoryId: string;
  brandId: string | null;
  productType: ProductType;
  price: number;
  salePrice: number | null;
  stock: number;
  images: string[];
  hasVariants: boolean;
  attributes: Record<string, unknown> | null;
  shipping: Record<string, unknown> | null;
  seo: Record<string, unknown> | null;
  slug: string | null;
  inventory: Record<string, unknown> | null;
  warranty: string | null;
  tags: string[];
  youtubeUrl: string | null;
  discountCodeId: string | null;
  status: ProductStatus;
  visibility: ProductVisibility;
  publishDate: Date | null;
  isActive: boolean;
  isFeatured: boolean;
  views: number;
  sales: number;
  averageRating: number;
  ratingCount: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
