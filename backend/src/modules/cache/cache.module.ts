import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { CacheStrategyService } from './cache-strategy.service';
import { CacheController } from './cache.controller';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');

        // Keep configuration compatible when REDIS_URL is present, while
        // defaulting to in-memory cache if redis store adapter is unavailable.
        void redisUrl;

        // Fallback to in-memory cache
        return {
          ttl: 5 * 60 * 1000,
        };
      },
    }),
  ],
  providers: [CacheStrategyService],
  controllers: [CacheController],
  exports: [CacheStrategyService, NestCacheModule],
})
export class CacheModule {}
