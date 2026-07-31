import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThan, Repository } from 'typeorm';
import { WebhookBin } from '../../common/entities/webhook-bin.entity';

@Injectable()
export class WebhookCleanupService {
  private readonly logger = new Logger(WebhookCleanupService.name);

  constructor(
    @InjectRepository(WebhookBin)
    private readonly binRepository: Repository<WebhookBin>,
  ) {}

  // Cascades to each bin's requests via the FK's onDelete: 'CASCADE'.
  @Cron(CronExpression.EVERY_HOUR)
  async purgeExpiredBins(): Promise<void> {
    const result = await this.binRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    if (result.affected) {
      this.logger.log(`Purged ${result.affected} expired webhook bin(s)`);
    }
  }
}
