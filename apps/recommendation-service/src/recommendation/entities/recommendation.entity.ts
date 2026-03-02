export class Recommendation {
  id: string;
  userId: string;
  productIds: string[];
  score: number;
  createdAt: Date;
  updatedAt: Date;
}
