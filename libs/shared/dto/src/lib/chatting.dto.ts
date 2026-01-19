import {
  IsEnum,
  ValidateNested,
  IsInt,
  Min,
  IsString,
  IsOptional,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  Length,
  IsUrl,
  IsISO8601,
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

  @IsString()
  @IsNotEmpty()
  @Length(1, 5000)
  content!: string;

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
