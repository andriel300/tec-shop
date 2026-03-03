export class Participant {
  id!: string;
  conversationId!: string;
  userId!: string | null;
  sellerId!: string | null;
  lastSeenAt!: Date | null;
  isOnline!: boolean;
  unreadCount!: number;
  muted!: boolean;
  joinedAt!: Date;
}
