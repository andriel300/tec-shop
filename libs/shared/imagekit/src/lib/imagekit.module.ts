import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ImageKitService } from './imagekit.service';

@Module({})
export class ImageKitModule {
  static forRoot(): DynamicModule {
    return {
      module: ImageKitModule,
      imports: [ConfigModule],
      providers: [ImageKitService],
      exports: [ImageKitService],
    };
  }
}
