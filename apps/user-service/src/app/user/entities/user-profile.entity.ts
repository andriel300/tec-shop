export class UserProfile {
  id!: string;
  userId!: string;
  name!: string;
  bio!: string | null;
  picture!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
