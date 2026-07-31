import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { WebhookRequest } from './webhook-request.entity';

@Entity('webhook_bins')
export class WebhookBin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @OneToMany(() => WebhookRequest, (request) => request.bin)
  requests: WebhookRequest[];
}
