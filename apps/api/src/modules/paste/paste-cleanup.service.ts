import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThan, Repository } from 'typeorm';
import { Paste } from '../../common/entities/paste.entity';

@Injectable()
export class PasteCleanupService {
  private readonly logger = new Logger(PasteCleanupService.name);

  constructor(
    @InjectRepository(Paste)
    private readonly pasteRepository: Repository<Paste>,
  ) {}

  // `expiresAt < now()` never matches NULL rows in SQL, so never-expiring
  // pastes (expiresAt IS NULL) are left alone with no extra filter needed.
  @Cron(CronExpression.EVERY_HOUR)
  async purgeExpiredPastes(): Promise<void> {
    const result = await this.pasteRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    if (result.affected) {
      this.logger.log(`Purged ${result.affected} expired paste(s)`);
    }
  }
}
