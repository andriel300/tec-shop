export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  ORDER = 'ORDER',
  PRODUCT = 'PRODUCT',
  SHOP = 'SHOP',
  SYSTEM = 'SYSTEM',
}

export class Notification {
  id!: string;
  sellerId!: string;
  title!: string;
  message!: string;
  type!: NotificationType;
  isRead!: boolean;
  metadata!: Record<string, unknown> | null;
  createdAt!: Date;
  updatedAt!: Date;
}
