import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImageKitService } from './imagekit.service';

@Module({})
export class ImageKitModule {
  static forRoot(): DynamicModule {
    return {
      module: ImageKitModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'IMAGEKIT_CONFIG',
          useFactory: (configService: ConfigService) => ({
            publicKey: configService.get<string>('IMAGEKIT_PUBLIC_KEY'),
            privateKey: configService.get<string>('IMAGEKIT_PRIVATE_KEY'),
            urlEndpoint: configService.get<string>('IMAGEKIT_URL_ENDPOINT'),
          }),
          inject: [ConfigService],
        },
        ImageKitService,
      ],
      exports: [ImageKitService],
    };
  }
}
