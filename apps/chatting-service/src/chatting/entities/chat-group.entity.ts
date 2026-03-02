export class ChatGroup {
  id: string;
  isGroup: boolean;
  name: string | null;
  creatorId: string;
  participantId: string[];
  createdAt: Date;
  updatedAt: Date;
}
