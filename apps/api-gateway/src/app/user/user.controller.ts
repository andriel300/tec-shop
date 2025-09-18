import {
  Controller,
  Get,
  Inject,
  Req,
  UseGuards,
  Patch,
  Body,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy
  ) {}
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: "Get the current user's profile" })
  @ApiResponse({ status: 200, description: 'User profile data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getUserProfile(@Req() req) {
    const userId = req.user.userId;
    const user$ = this.userClient.send('get-user-profile', userId);
    return firstValueFrom(user$);
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  @ApiOperation({ summary: "Update the current user's profile" })
  @ApiResponse({ status: 200, description: 'Profile successfully updated.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async updateUserProfile(@Req() req, @Body() body: UpdateUserDto) {
    const payload = {
      userId: req.user.userId,
      data: body,
    };
    const user$ = this.userClient.send('update-user-profile', payload);
    return firstValueFrom(user$);
  }
}
