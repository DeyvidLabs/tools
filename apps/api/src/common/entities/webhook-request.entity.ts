import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WebhookBin } from './webhook-bin.entity';

@Entity('webhook_requests')
export class WebhookRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  binId: string;

  @ManyToOne(() => WebhookBin, (bin) => bin.requests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'binId' })
  bin: WebhookBin;

  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Column({ type: 'jsonb' })
  headers: Record<string, string | string[]>;

  @Column({ type: 'jsonb' })
  query: Record<string, unknown>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contentType: string | null;

  // Raw body, stored as text. Binary bodies are base64-encoded first —
  // see `bodyEncoding` for which form this column holds.
  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ type: 'varchar', length: 10, default: 'utf8' })
  bodyEncoding: 'utf8' | 'base64';

  @Column({ type: 'varchar', length: 64, nullable: true })
  sourceIp: string | null;

  @CreateDateColumn()
  receivedAt: Date;
}
