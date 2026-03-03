export class Brand {
  id!: string;
  name!: string;
  slug!: string;
  description!: string | null;
  logo!: string | null;
  website!: string | null;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
