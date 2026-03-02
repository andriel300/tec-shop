export class Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  attributes: Record<string, unknown> | null;
  image: string | null;
  isActive: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}
