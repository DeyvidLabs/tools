import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';
import { resolve } from 'path';
import { User } from './common/entities/user.entity';
import { Permission } from './common/entities/permission.entity';
import { WebhookBin } from './common/entities/webhook-bin.entity';
import { WebhookRequest } from './common/entities/webhook-request.entity';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PermissionModule } from './modules/permission/permission.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { WsTesterModule } from './modules/ws-tester/ws-tester.module';
import { AuthGuard } from './common/guards/auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
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
        JWT_SECRET: Joi.string().min(16).required(),
        REFRESH_TOKEN_SECRET: Joi.string().min(16).required(),
        JWT_EXPIRATION: Joi.string().default('15m'),
        REFRESH_TOKEN_EXPIRATION: Joi.string().default('7d'),
        DATABASE_URL: Joi.string().required(),
        CORS_ORIGIN: Joi.string().default('*'),
        GOOGLE_CLIENT_ID: Joi.string().optional().allow(''),
        GOOGLE_CLIENT_SECRET: Joi.string().optional().allow(''),
        GOOGLE_CALLBACK_URL: Joi.string().optional().allow(''),
        WEBHOOK_BIN_TTL_HOURS: Joi.number().positive().default(24),
      }),
      validationOptions: { allowUnknown: true, abortEarly: true },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [User, Permission, WebhookBin, WebhookRequest],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    AuthModule,
    UserModule,
    PermissionModule,
    WebhookModule,
    WsTesterModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
  ],
  controllers: [AppController],
  providers: [
    AuthGuard,
    PermissionsGuard,
    ThrottlerGuard,
    { provide: APP_GUARD, useExisting: AuthGuard },
    { provide: APP_GUARD, useExisting: PermissionsGuard },
    { provide: APP_GUARD, useExisting: ThrottlerGuard },
  ],
})
export class AppModule {}
