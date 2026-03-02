export class ProductVariant {
  id: string;
  productId: string;
  sku: string;
  attributes: Record<string, unknown>;
  price: number;
  salePrice: number | null;
  stock: number;
  image: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
