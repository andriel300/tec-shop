export class Notification {
  id!: string;
  targetType!: string;
  targetId!: string;
  templateId!: string;
  title!: string;
  message!: string;
  type!: string;
  isRead!: boolean;
  metadata!: Record<string, unknown> | null;
  createdAt!: Date;
}
