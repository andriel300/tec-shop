export class ProductRating {
  id!: string;
  productId!: string;
  userId!: string;
  rating!: number;
  title!: string | null;
  content!: string | null;
  images!: string[];
  reviewerName!: string | null;
  reviewerAvatar!: string | null;
  sellerResponse!: string | null;
  sellerResponseAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}
