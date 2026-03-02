export class ShopAnalytics {
  id: string;
  shopId: string;
  visits: number;
  uniqueVisitors: number;
  totalProductViews: number;
  totalCartAdds: number;
  totalWishlistAdds: number;
  totalPurchases: number;
  totalRevenue: number;
  averageOrderValue: number;
  lastVisitAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
