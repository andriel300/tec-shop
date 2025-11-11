import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { KafkaProducerService } from '../../services/kafka-producer.service';
import { TrackEventDto } from '@tec-shop/dto';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly kafkaProducer: KafkaProducerService) {}

  @Post('track')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Track user analytics event' })
  @ApiResponse({
    status: 202,
    description: 'Event accepted and queued for processing',
  })
  @ApiResponse({ status: 400, description: 'Invalid event data' })
  async trackEvent(@Body() eventDto: TrackEventDto): Promise<{ success: boolean }> {
    try {
      // Send event to Kafka asynchronously
      // Using fire-and-forget pattern for better performance
      this.kafkaProducer
        .sendAnalyticsEvent({
          userId: eventDto.userId,
          productId: eventDto.productId,
          shopId: eventDto.shopId,
          action: eventDto.action,
          country: eventDto.country,
          city: eventDto.city,
          device: eventDto.device,
        })
        .catch((error) => {
          this.logger.error(
            `Failed to send analytics event: ${eventDto.action}`,
            error instanceof Error ? error.stack : undefined
          );
        });

      // Return immediately without waiting for Kafka
      return { success: true };
    } catch (error) {
      this.logger.error(
        'Error tracking analytics event',
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  @Post('track/batch')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Track multiple analytics events in batch' })
  @ApiResponse({
    status: 202,
    description: 'Events accepted and queued for processing',
  })
  @ApiResponse({ status: 400, description: 'Invalid event data' })
  async trackEventsBatch(
    @Body() events: TrackEventDto[]
  ): Promise<{ success: boolean; count: number }> {
    try {
      // Send events to Kafka asynchronously
      this.kafkaProducer
        .sendAnalyticsEventsBatch(
          events.map((event) => ({
            userId: event.userId,
            productId: event.productId,
            shopId: event.shopId,
            action: event.action,
            country: event.country,
            city: event.city,
            device: event.device,
          }))
        )
        .catch((error) => {
          this.logger.error(
            'Failed to send analytics events batch',
            error instanceof Error ? error.stack : undefined
          );
        });

      return { success: true, count: events.length };
    } catch (error) {
      this.logger.error(
        'Error tracking analytics events batch',
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }
}
