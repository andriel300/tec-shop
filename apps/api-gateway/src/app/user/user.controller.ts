import {
  Controller,
  Get,
  Inject,
  Req,
  UseGuards,
  Patch,
  Body,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import type {
  UpdateUserDto,
  CreateShippingAddressDto,
  UpdateShippingAddressDto,
} from '@tec-shop/dto';
import { JwtAuthGuard } from '../../guards/auth';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CircuitBreakerService } from '../../common/circuit-breaker.service';
import { ImageKitService } from '@tec-shop/shared/imagekit';

const AVATAR_SIZE_LIMIT = 5 * 1024 * 1024; // 5 MB
const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    private readonly cb: CircuitBreakerService,
    private readonly imagekitService: ImageKitService,
  ) {}
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: "Get the current user's profile" })
  @ApiResponse({ status: 200, description: 'User profile data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getUserProfile(@Req() req: { user: { userId: string } }) {
    const userId = req.user.userId;
    return this.cb.fire('USER_SERVICE', () => firstValueFrom(this.userClient.send('get-user-profile', userId)));
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  @ApiOperation({ summary: "Update the current user's profile" })
  @ApiResponse({ status: 200, description: 'Profile successfully updated.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async updateUserProfile(@Req() req: { user: { userId: string } }, @Body() body: UpdateUserDto) {
    const payload = {
      userId: req.user.userId,
      data: body,
    };
    return this.cb.fire('USER_SERVICE', () => firstValueFrom(this.userClient.send('update-user-profile', payload)));
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-avatar')
  @ApiOperation({ summary: 'Upload a profile avatar image' })
  @ApiResponse({ status: 201, description: 'Avatar uploaded successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid file.' })
  @UseInterceptors(FileInterceptor('image', {
    limits: { fileSize: AVATAR_SIZE_LIMIT },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype)) {
        return cb(new BadRequestException('Only JPEG, PNG, WebP, and GIF images are allowed'), false);
      }
      cb(null, true);
    },
  }))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string; fileId: string }> {
    if (!file) throw new BadRequestException('No image file provided');
    const result = await this.imagekitService.uploadFile(file.buffer, file.originalname, 'user-avatars');
    return { url: result.url, fileId: result.fileId };
  }

  // Shipping Address Endpoints
  @UseGuards(JwtAuthGuard)
  @Post('addresses')
  @ApiOperation({ summary: 'Create a new shipping address' })
  @ApiResponse({ status: 201, description: 'Address created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error or limit reached.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createShippingAddress(
    @Req() req: { user: { userId: string } },
    @Body() body: CreateShippingAddressDto
  ) {
    const payload = {
      userId: req.user.userId,
      data: body,
    };
    return this.cb.fire('USER_SERVICE', () => firstValueFrom(this.userClient.send('create-shipping-address', payload)));
  }

  @UseGuards(JwtAuthGuard)
  @Get('addresses')
  @ApiOperation({ summary: 'Get all shipping addresses for the current user' })
  @ApiResponse({ status: 200, description: 'List of shipping addresses.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getShippingAddresses(@Req() req: { user: { userId: string } }) {
    return this.cb.fire('USER_SERVICE', () => firstValueFrom(this.userClient.send(
      'get-shipping-addresses',
      req.user.userId
    )));
  }

  @UseGuards(JwtAuthGuard)
  @Get('addresses/:id')
  @ApiOperation({ summary: 'Get a specific shipping address' })
  @ApiResponse({ status: 200, description: 'Shipping address data.' })
  @ApiResponse({ status: 404, description: 'Address not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getShippingAddress(
    @Req() req: { user: { userId: string } },
    @Param('id') addressId: string
  ) {
    const payload = {
      userId: req.user.userId,
      addressId,
    };
    return this.cb.fire('USER_SERVICE', () => firstValueFrom(this.userClient.send('get-shipping-address', payload)));
  }

  @UseGuards(JwtAuthGuard)
  @Patch('addresses/:id')
  @ApiOperation({ summary: 'Update a shipping address' })
  @ApiResponse({ status: 200, description: 'Address updated successfully.' })
  @ApiResponse({ status: 404, description: 'Address not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async updateShippingAddress(
    @Req() req: { user: { userId: string } },
    @Param('id') addressId: string,
    @Body() body: UpdateShippingAddressDto
  ) {
    const payload = {
      userId: req.user.userId,
      addressId,
      data: body,
    };
    return this.cb.fire('USER_SERVICE', () => firstValueFrom(this.userClient.send('update-shipping-address', payload)));
  }

  @UseGuards(JwtAuthGuard)
  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Delete a shipping address' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Address not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async deleteShippingAddress(
    @Req() req: { user: { userId: string } },
    @Param('id') addressId: string
  ) {
    const payload = {
      userId: req.user.userId,
      addressId,
    };
    return this.cb.fire('USER_SERVICE', () => firstValueFrom(this.userClient.send('delete-shipping-address', payload)));
  }

  @UseGuards(JwtAuthGuard)
  @Patch('addresses/:id/default')
  @ApiOperation({ summary: 'Set an address as the default shipping address' })
  @ApiResponse({ status: 200, description: 'Default address updated successfully.' })
  @ApiResponse({ status: 404, description: 'Address not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async setDefaultShippingAddress(
    @Req() req: { user: { userId: string } },
    @Param('id') addressId: string
  ) {
    const payload = {
      userId: req.user.userId,
      addressId,
    };
    return this.cb.fire('USER_SERVICE', () => firstValueFrom(this.userClient.send(
      'set-default-shipping-address',
      payload
    )));
  }

  @UseGuards(JwtAuthGuard)
  @Post('addresses/:id/copy')
  @ApiOperation({ summary: 'Copy an existing shipping address' })
  @ApiResponse({ status: 201, description: 'Address copied successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request - limit reached.' })
  @ApiResponse({ status: 404, description: 'Address not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async copyShippingAddress(
    @Req() req: { user: { userId: string } },
    @Param('id') addressId: string
  ) {
    const payload = {
      userId: req.user.userId,
      addressId,
    };
    return this.cb.fire('USER_SERVICE', () => firstValueFrom(this.userClient.send('copy-shipping-address', payload)));
  }
}
