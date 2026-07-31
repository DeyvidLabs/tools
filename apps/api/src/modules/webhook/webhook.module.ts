import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookBin } from '../../common/entities/webhook-bin.entity';
import { WebhookRequest } from '../../common/entities/webhook-request.entity';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WebhookCleanupService } from './webhook-cleanup.service';

@Module({
  imports: [TypeOrmModule.forFeature([WebhookBin, WebhookRequest])],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookCleanupService],
})
export class WebhookModule {}
