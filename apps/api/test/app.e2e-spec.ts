/**
 * app.e2e-spec.ts
 *
 * Smoke test – verifies the NestJS application bootstraps without errors
 * when all external dependencies (PostgreSQL, guards) are replaced with mocks.
 *
 * Run with: yarn test:e2e
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from './../src/app.module';
import { req } from './utils/http';

describe('AppModule bootstrap (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue({
        initialize: jest.fn().mockResolvedValue(undefined),
        destroy: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', { exclude: ['health'] });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should start and respond to /health with 200', async () => {
    await req(app).get('/health').expect(200);
  });

  it('should respond to unknown routes with 404 (not 500)', async () => {
    await req(app).get('/non-existent-route').expect(404);
  });
});
