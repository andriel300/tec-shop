export class Shop {
  id: string;
  sellerId: string;
  businessName: string;
  bio: string | null;
  description: string | null;
  category: string;
  address: string;
  openingHours: string;
  website: string | null;
  socialLinks: Record<string, unknown>[];
  returnPolicy: string | null;
  shippingPolicy: string | null;
  rating: number;
  totalOrders: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
