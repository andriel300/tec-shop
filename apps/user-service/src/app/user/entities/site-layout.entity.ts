export class HeroSlide {
  id!: string;
  siteLayoutId!: string;
  title!: string;
  subtitle!: string | null;
  imageUrl!: string;
  actionUrl!: string | null;
  actionLabel!: string | null;
  order!: number;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export class SiteLayout {
  id!: string;
  logo!: string | null;
  banner!: string | null;
  updatedAt!: Date;
  createdAt!: Date;
}
