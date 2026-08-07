import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('mock_endpoints')
export class MockEndpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'int', default: 200 })
  statusCode: number;

  @Column({ type: 'jsonb', nullable: true })
  responseBody: unknown;

  @Column({ type: 'jsonb', default: {} })
  responseHeaders: Record<string, string>;

  @Column({ type: 'int', default: 0 })
  delayMs: number;

  @Column({ type: 'varchar', length: 64 })
  deleteTokenHash: string;
}
