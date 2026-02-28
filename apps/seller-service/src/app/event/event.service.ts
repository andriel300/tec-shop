import { Injectable, Logger, NotFoundException, ForbiddenException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@tec-shop/seller-client';
import type { CreateEventDto, UpdateEventDto, EventResponse } from '@tec-shop/dto';

@Injectable()
export class EventService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventService.name);
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async onModuleInit() {
    await this.prisma.$connect();
    this.logger.log('Event Service - Prisma connected');
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
    this.logger.log('Event Service - Prisma disconnected');
  }

  /**
   * Create a new event for a shop
   */
  async createEvent(authId: string, createEventDto: CreateEventDto): Promise<EventResponse> {
    this.logger.log(`Creating event for authId: ${authId}`);

    // Get seller and shop
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
      include: { shop: true },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    if (!seller.shop) {
      throw new NotFoundException('Shop not found. Please create a shop first.');
    }

    // Create event
    const event = await this.prisma.event.create({
      data: {
        shopId: seller.shop.id,
        title: createEventDto.title,
        description: createEventDto.description,
        bannerImage: createEventDto.bannerImage,
        startDate: new Date(createEventDto.startDate),
        endDate: new Date(createEventDto.endDate),
        status: createEventDto.status || 'DRAFT',
        isActive: createEventDto.isActive ?? true,
        metadata: createEventDto.metadata || {},
      },
      include: {
        shop: {
          select: {
            id: true,
            businessName: true,
            category: true,
          },
        },
      },
    });

    this.logger.log(`Event created successfully: ${event.id}`);
    return this.mapEventToResponse(event);
  }

  /**
   * Get all events for a seller's shop
   */
  async getEvents(authId: string, filters?: {
    status?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ data: EventResponse[]; total: number }> {
    this.logger.log(`Getting events for authId: ${authId}`);

    // Get seller and shop
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
      include: { shop: true },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    if (!seller.shop) {
      return { data: [], total: 0 };
    }

    // Build filter query
    const where: Record<string, unknown> = {
      shopId: seller.shop.id,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Get events with pagination
    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: {
          shop: {
            select: {
              id: true,
              businessName: true,
              category: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      this.prisma.event.count({ where }),
    ]);

    this.logger.log(`Found ${total} events for seller's shop`);
    return {
      data: events.map(this.mapEventToResponse),
      total,
    };
  }

  /**
   * Get a single event by ID
   */
  async getEventById(authId: string, eventId: string): Promise<EventResponse> {
    this.logger.log(`Getting event ${eventId} for authId: ${authId}`);

    // Get seller and shop
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
      include: { shop: true },
    });

    if (!seller || !seller.shop) {
      throw new NotFoundException('Seller or shop not found');
    }

    // Get event
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        shop: {
          select: {
            id: true,
            businessName: true,
            category: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Verify ownership
    if (event.shopId !== seller.shop.id) {
      throw new ForbiddenException('You do not have access to this event');
    }

    return this.mapEventToResponse(event);
  }

  /**
   * Update an event
   */
  async updateEvent(authId: string, eventId: string, updateEventDto: UpdateEventDto): Promise<EventResponse> {
    this.logger.log(`Updating event ${eventId} for authId: ${authId}`);

    // Verify ownership first
    await this.getEventById(authId, eventId);

    // Update event
    const event = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        title: updateEventDto.title,
        description: updateEventDto.description,
        bannerImage: updateEventDto.bannerImage,
        startDate: updateEventDto.startDate ? new Date(updateEventDto.startDate) : undefined,
        endDate: updateEventDto.endDate ? new Date(updateEventDto.endDate) : undefined,
        status: updateEventDto.status,
        isActive: updateEventDto.isActive,
        metadata: updateEventDto.metadata,
      },
      include: {
        shop: {
          select: {
            id: true,
            businessName: true,
            category: true,
          },
        },
      },
    });

    this.logger.log(`Event updated successfully: ${event.id}`);
    return this.mapEventToResponse(event);
  }

  /**
   * Delete an event
   */
  async deleteEvent(authId: string, eventId: string): Promise<{ message: string }> {
    this.logger.log(`Deleting event ${eventId} for authId: ${authId}`);

    // Verify ownership first
    await this.getEventById(authId, eventId);

    // Delete event
    await this.prisma.event.delete({
      where: { id: eventId },
    });

    this.logger.log(`Event deleted successfully: ${eventId}`);
    return { message: 'Event deleted successfully' };
  }

  /**
   * Map Prisma event to EventResponse
   */
  private mapEventToResponse(event: Record<string, unknown>): EventResponse {
    return {
      id: event.id as string,
      shopId: event.shopId as string,
      title: event.title as string,
      description: event.description as string,
      bannerImage: event.bannerImage as string | null | undefined,
      startDate: event.startDate as Date,
      endDate: event.endDate as Date,
      status: event.status as 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED',
      isActive: event.isActive as boolean,
      metadata: event.metadata as Record<string, unknown> | null | undefined,
      createdAt: event.createdAt as Date,
      updatedAt: event.updatedAt as Date,
      shop: event.shop as { id: string; businessName: string; category: string } | undefined,
    };
  }
}
