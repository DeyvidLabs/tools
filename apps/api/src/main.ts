import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  ValidationPipe,
  Logger,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WsAdapter } from '@nestjs/platform-ws';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  // Default body parsing disabled — wired manually below so the webhook
  // capture route can record the exact raw bytes of any content type
  // instead of only application/json and x-www-form-urlencoded.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  // Raw `ws`, not the Nest default (Socket.IO) — so any standard WebSocket
  // client can connect to the ws-tester gateway, not just Socket.IO ones.
  app.useWebSocketAdapter(new WsAdapter(app));

  // Path-scoped raw parser for the capture route: reads the body as a Buffer
  // regardless of Content-Type. Runs before the generic parsers below, so
  // body-parser marks the request as already-parsed and they skip it.
  app.use(
    '/api/webhook/capture',
    bodyParser.raw({ type: () => true, limit: '256kb' }),
  );
  // Paste content is capped at 256KB by CreatePasteDto's @MaxLength, but JSON
  // string-escaping worst case (e.g. control bytes -> \uXXXX) can inflate the
  // wire size well past that — this only raises the parser's ceiling, the DTO
  // validator is what actually enforces the real limit.
  app.use('/api/paste', bodyParser.json({ limit: '2mb' }));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Trust the first proxy hop (nginx/Caddy) so req.ip and the ThrottlerGuard
  // see the real client IP instead of bucketing every request under the proxy's IP.
  app.set('trust proxy', 1);

  app.enableShutdownHooks();
  app.setGlobalPrefix('api', { exclude: ['health'] });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;
  const corsOrigins = (configService.get<string>('CORS_ORIGIN') ?? '*')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(compression());
  app.use(
    helmet({
      contentSecurityPolicy:
        configService.get<string>('NODE_ENV') === 'production',
    }),
  );
  app.use(cookieParser());
  app.enableCors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new RequestIdInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NestJS Auth & Roles')
    .setDescription(
      'Authentication backend with JWT, refresh token rotation, RBAC, and Google OAuth2.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'Bearer token',
    )
    .addCookieAuth('access_token')
    .build();

  SwaggerModule.setup('docs', app, () =>
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  await app.listen(port, '0.0.0.0');
  logger.log(`Application running on http://localhost:${port}`);
  logger.log(`Swagger docs available at http://localhost:${port}/docs`);
}

bootstrap();
