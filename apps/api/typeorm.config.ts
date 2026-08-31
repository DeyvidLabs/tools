import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { WebhookBin } from './src/common/entities/webhook-bin.entity';
import { WebhookRequest } from './src/common/entities/webhook-request.entity';
import { Paste } from './src/common/entities/paste.entity';
import { ShortLink } from './src/common/entities/short-link.entity';
import { MockEndpoint } from './src/common/entities/mock-endpoint.entity';

// Single .env at the monorepo root — shared with apps/web, not per-app.
dotenv.config({ path: resolve(process.cwd(), '../../.env') });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [WebhookBin, WebhookRequest, Paste, ShortLink, MockEndpoint],
  migrations: ['database/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
