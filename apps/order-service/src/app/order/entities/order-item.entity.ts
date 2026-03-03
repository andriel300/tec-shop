export class OrderItem {
  id!: string;
  orderId!: string;
  sellerId!: string;
  shopId!: string;
  shopName!: string;
  productId!: string;
  productName!: string;
  productSlug!: string;
  productImage!: string | null;
  variantId!: string | null;
  sku!: string | null;
  unitPrice!: number;
  quantity!: number;
  subtotal!: number;
  sellerPayout!: number;
  platformFee!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
