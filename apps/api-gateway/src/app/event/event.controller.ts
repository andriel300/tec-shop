import {
  Body,
  Controller,
  Inject,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/auth';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CreateEventDto, UpdateEventDto } from '@tec-shop/dto';

@ApiTags('Events')
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER')
@ApiBearerAuth()
export class EventController {
  private readonly logger = new Logger(EventController.name);

  constructor(
    @Inject('SELLER_SERVICE') private readonly sellerService: ClientProxy
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new event',
    description: 'Create a new promotional event for the seller&apos;s shop',
  })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid event data',
  })
  @ApiResponse({
    status: 404,
    description: 'Shop not found',
  })
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @Req() req: Record<string, unknown>
  ) {
    const user = req.user as { userId: string };
    this.logger.log(`Creating event for seller authId: ${user.userId}`);

    return firstValueFrom(
      this.sellerService.send('seller-create-event', {
        authId: user.userId,
        eventData: createEventDto,
      })
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all events',
    description: 'Retrieve all events for the authenticated seller&apos;s shop',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Events retrieved successfully',
  })
  async getEvents(
    @Req() req: Record<string, unknown>,
    @Query('status') status?: string,
    @Query('isActive') isActive?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const user = req.user as { userId: string };
    this.logger.log(`Fetching events for seller authId: ${user.userId}`);

    const filters: Record<string, unknown> = {};
    if (status) filters.status = status;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (limit) filters.limit = parseInt(limit, 10);
    if (offset) filters.offset = parseInt(offset, 10);

    return firstValueFrom(
      this.sellerService.send('seller-get-events', {
        authId: user.userId,
        filters,
      })
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get event by ID',
    description: 'Retrieve a specific event by its ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Event retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  async getEventById(
    @Param('id') eventId: string,
    @Req() req: Record<string, unknown>
  ) {
    const user = req.user as { userId: string };
    this.logger.log(`Fetching event ${eventId} for seller authId: ${user.userId}`);

    return firstValueFrom(
      this.sellerService.send('seller-get-event-by-id', {
        authId: user.userId,
        eventId,
      })
    );
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update an event',
    description: 'Update an existing event',
  })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  async updateEvent(
    @Param('id') eventId: string,
    @Body() updateEventDto: UpdateEventDto,
    @Req() req: Record<string, unknown>
  ) {
    const user = req.user as { userId: string };
    this.logger.log(`Updating event ${eventId} for seller authId: ${user.userId}`);

    return firstValueFrom(
      this.sellerService.send('seller-update-event', {
        authId: user.userId,
        eventId,
        eventData: updateEventDto,
      })
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an event',
    description: 'Delete an event by its ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Event deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  async deleteEvent(
    @Param('id') eventId: string,
    @Req() req: Record<string, unknown>
  ) {
    const user = req.user as { userId: string };
    this.logger.log(`Deleting event ${eventId} for seller authId: ${user.userId}`);

    return firstValueFrom(
      this.sellerService.send('seller-delete-event', {
        authId: user.userId,
        eventId,
      })
    );
  }
}
