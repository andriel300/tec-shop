import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EventService } from './event.service';
import type { CreateEventDto, UpdateEventDto } from '@tec-shop/dto';

@Controller()
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @MessagePattern('seller-create-event')
  async createEvent(
    @Payload() payload: { authId: string; eventData: CreateEventDto }
  ) {
    return this.eventService.createEvent(payload.authId, payload.eventData);
  }

  @MessagePattern('seller-get-events')
  async getEvents(
    @Payload()
    payload: {
      authId: string;
      filters?: {
        status?: string;
        isActive?: boolean;
        limit?: number;
        offset?: number;
      };
    }
  ) {
    return this.eventService.getEvents(payload.authId, payload.filters);
  }

  @MessagePattern('seller-get-event-by-id')
  async getEventById(@Payload() payload: { authId: string; eventId: string }) {
    return this.eventService.getEventById(payload.authId, payload.eventId);
  }

  @MessagePattern('seller-update-event')
  async updateEvent(
    @Payload()
    payload: { authId: string; eventId: string; eventData: UpdateEventDto }
  ) {
    return this.eventService.updateEvent(
      payload.authId,
      payload.eventId,
      payload.eventData
    );
  }

  @MessagePattern('seller-delete-event')
  async deleteEvent(@Payload() payload: { authId: string; eventId: string }) {
    return this.eventService.deleteEvent(payload.authId, payload.eventId);
  }
}
