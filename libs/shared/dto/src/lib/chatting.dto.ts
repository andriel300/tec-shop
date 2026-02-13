import {
  IsEnum,
  ValidateNested,
  IsInt,
  Min,
  Max,
  IsString,
  IsOptional,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  Length,
  IsUrl,
  IsISO8601,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ChatEventType {
  NEW_MESSAGE = 'NEW_MESSAGE',
  MESSAGE_SEEN = 'MESSAGE_SEEN',
}

export class ChatEventEnvelope<T> {
  @IsEnum(ChatEventType)
  type!: ChatEventType;

  @ValidateNested()
  @Type(() => Object)
  payload!: T;

  @IsInt()
  @Min(1)
  version!: number;
}

export enum SenderType {
  USER = 'user',
  SELLER = 'seller',
}

export class ChatAttachmentDto {
  @IsUrl()
  @IsNotEmpty()
  url!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  type?: string;
}

export class CreateChatMessageDto {
  @IsMongoId()
  conversationId!: string;

  @IsMongoId()
  senderId!: string;

  @IsEnum(SenderType)
  senderType!: SenderType;

  @IsString()
  @IsNotEmpty()
  @Length(1, 5000)
  content!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatAttachmentDto)
  attachments?: ChatAttachmentDto[];
}

export class ChatMessageEventDto {
  @IsMongoId()
  conversationId!: string;

  @IsMongoId()
  senderId!: string;

  @IsEnum(SenderType)
  senderType!: SenderType;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  content?: string;

  @IsISO8601()
  createdAt!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatAttachmentDto)
  attachments?: ChatAttachmentDto[];
}

export class MarkAsSeenDto {
  @IsMongoId()
  conversationId!: string;

  @IsMongoId()
  userId!: string;
}

export class GetMessagesDto {
  @IsMongoId()
  conversationId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50) // Limit to 50 messages per page for chat
  limit?: number = 20;
}

// ==================== Conversation DTOs ====================

export enum ParticipantType {
  USER = 'user',
  SELLER = 'seller',
}

export class CreateConversationDto {
  @IsMongoId()
  targetId!: string;

  @IsEnum(ParticipantType)
  targetType!: ParticipantType;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  initialMessage?: string;
}

export class CreateConversationInternalDto {
  @IsMongoId()
  initiatorId!: string;

  @IsEnum(ParticipantType)
  initiatorType!: ParticipantType;

  @IsMongoId()
  targetId!: string;

  @IsEnum(ParticipantType)
  targetType!: ParticipantType;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  initialMessage?: string;
}

export class ParticipantInfoDto {
  @IsMongoId()
  id!: string;

  @IsEnum(ParticipantType)
  type!: ParticipantType;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

export class LastMessageDto {
  @IsMongoId()
  id!: string;

  @IsString()
  content!: string;

  @IsMongoId()
  senderId!: string;

  @IsEnum(SenderType)
  senderType!: SenderType;

  @IsISO8601()
  createdAt!: string;
}

export class ConversationResponseDto {
  @IsMongoId()
  id!: string;

  @ValidateNested()
  @Type(() => ParticipantInfoDto)
  otherParticipant!: ParticipantInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LastMessageDto)
  lastMessage?: LastMessageDto;

  @IsInt()
  @Min(0)
  unreadCount!: number;

  @IsISO8601()
  createdAt!: string;

  @IsOptional()
  @IsISO8601()
  lastSeenAt?: string;
}

export class GetConversationsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

export class GetConversationsInternalDto {
  @IsMongoId()
  participantId!: string;

  @IsEnum(ParticipantType)
  participantType!: ParticipantType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

export class ConversationListResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversationResponseDto)
  conversations!: ConversationResponseDto[];

  @IsInt()
  total!: number;

  @IsInt()
  page!: number;

  @IsInt()
  limit!: number;
}

export class TypingIndicatorDto {
  @IsMongoId()
  conversationId!: string;

  @IsMongoId()
  userId!: string;

  @IsEnum(ParticipantType)
  userType!: ParticipantType;

  @IsBoolean()
  isTyping!: boolean;
}

export class GetConversationDto {
  @IsMongoId()
  conversationId!: string;

  @IsMongoId()
  participantId!: string;

  @IsEnum(ParticipantType)
  participantType!: ParticipantType;
}

export class MarkConversationSeenDto {
  @IsMongoId()
  conversationId!: string;

  @IsMongoId()
  participantId!: string;

  @IsEnum(ParticipantType)
  participantType!: ParticipantType;
}

export class CheckOnlineDto {
  @IsMongoId()
  userId!: string;
}

export class GetMessagesInternalDto {
  @IsMongoId()
  conversationId!: string;

  @IsMongoId()
  participantId!: string;

  @IsEnum(ParticipantType)
  participantType!: ParticipantType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
