import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 6001,
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy],
  exports: [ClientsModule, PassportModule, JwtStrategy],
})
export class AuthModule {}
