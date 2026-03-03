export enum EventStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class Event {
  id!: string;
  shopId!: string;
  title!: string;
  description!: string;
  bannerImage!: string | null;
  startDate!: Date;
  endDate!: Date;
  status!: EventStatus;
  isActive!: boolean;
  metadata!: Record<string, unknown> | null;
  createdAt!: Date;
  updatedAt!: Date;
}
