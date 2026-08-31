import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';
import { resolve } from 'path';
import { WebhookBin } from './common/entities/webhook-bin.entity';
import { WebhookRequest } from './common/entities/webhook-request.entity';
import { Paste } from './common/entities/paste.entity';
import { ShortLink } from './common/entities/short-link.entity';
import { MockEndpoint } from './common/entities/mock-endpoint.entity';
import { WebhookModule } from './modules/webhook/webhook.module';
import { PasteModule } from './modules/paste/paste.module';
import { UrlShortenerModule } from './modules/url-shortener/url-shortener.module';
import { MockEndpointModule } from './modules/mock-endpoint/mock-endpoint.module';
import { WsTesterModule } from './modules/ws-tester/ws-tester.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Single .env at the monorepo root — shared with apps/web, not per-app.
      envFilePath: resolve(process.cwd(), '../../.env'),
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        CORS_ORIGIN: Joi.string().default('*'),
        WEBHOOK_BIN_TTL_HOURS: Joi.number().positive().default(24),
        PASTE_ADMIN_TOKEN: Joi.string().optional().allow(''),
        URL_SHORTENER_ADMIN_TOKEN: Joi.string().optional().allow(''),
        MOCK_ENDPOINT_TTL_HOURS: Joi.number().positive().default(24),
      }),
      validationOptions: { allowUnknown: true, abortEarly: true },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [WebhookBin, WebhookRequest, Paste, ShortLink, MockEndpoint],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    WebhookModule,
    PasteModule,
    UrlShortenerModule,
    MockEndpointModule,
    WsTesterModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
  ],
  controllers: [AppController],
  providers: [
    ThrottlerGuard,
    { provide: APP_GUARD, useExisting: ThrottlerGuard },
  ],
})
export class AppModule {}
