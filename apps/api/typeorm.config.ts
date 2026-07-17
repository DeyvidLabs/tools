import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { User } from './src/common/entities/user.entity';
import { Permission } from './src/common/entities/permission.entity';

// Single .env at the monorepo root — shared with apps/web, not per-app.
dotenv.config({ path: resolve(process.cwd(), '../../.env') });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Permission],
  migrations: ['database/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
