import { Controller, Get, Inject, Req, UseGuards, Patch, Body } from '@nestjs/common';
import { AuthGuard } from '../../guards/auth/auth.guard';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy
  ) {}
  @UseGuards(AuthGuard)
  @Get()
  async getUserProfile(@Req() req) {
    const userId = req.user.userId;
    const user$ = this.userClient.send('get-user-profile', userId);
    return firstValueFrom(user$);
  }

  @UseGuards(AuthGuard)
  @Patch()
  async updateUserProfile(@Req() req, @Body() body: UpdateUserDto) {
    const payload = {
      userId: req.user.userId,
      data: body,
    };
    const user$ = this.userClient.send('update-user-profile', payload);
    return firstValueFrom(user$);
  }
}
