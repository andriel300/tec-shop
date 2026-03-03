export class UserAnalytics {
  id!: string;
  userId!: string;
  lastVisited!: Date;
  actions!: Record<string, unknown>[];
  totalViews!: number;
  totalCartAdds!: number;
  totalWishlist!: number;
  totalPurchases!: number;
  country!: string | null;
  city!: string | null;
  device!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
