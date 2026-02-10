import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';

@ApiTags('Public - Layout')
@Controller('get-layouts')
export class PublicLayoutController {
  constructor(
    @Inject('ADMIN_SERVICE') private readonly adminService: ClientProxy
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get site layout (public)',
    description: 'Retrieves the site layout configuration (logo, banner). No authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Layout retrieved successfully',
  })
  async getLayout() {
    return firstValueFrom(
      this.adminService.send('admin.getLayout', {})
    );
  }
}
