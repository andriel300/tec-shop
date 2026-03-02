export class ProductAnalytics {
  id: string;
  productId: string;
  shopId: string | null;
  views: number;
  uniqueViews: number;
  cartAdds: number;
  wishlistAdds: number;
  wishlistRemoves: number;
  purchases: number;
  viewToCartRate: number;
  viewToWishlistRate: number;
  cartToPurchaseRate: number;
  lastViewAt: Date | null;
  lastCartAddAt: Date | null;
  lastPurchaseAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
