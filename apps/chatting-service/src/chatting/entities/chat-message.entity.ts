export class ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: string;
  content: string | null;
  attachments: Record<string, unknown>[];
  status: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
