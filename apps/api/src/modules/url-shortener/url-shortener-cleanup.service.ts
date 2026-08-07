import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThan, Repository } from 'typeorm';
import { ShortLink } from '../../common/entities/short-link.entity';

@Injectable()
export class UrlShortenerCleanupService {
  private readonly logger = new Logger(UrlShortenerCleanupService.name);

  constructor(
    @InjectRepository(ShortLink)
    private readonly shortLinkRepository: Repository<ShortLink>,
  ) {}

  // `expiresAt < now()` never matches NULL rows in SQL, so never-expiring
  // short links (expiresAt IS NULL) are left alone with no extra filter needed.
  @Cron(CronExpression.EVERY_HOUR)
  async purgeExpiredShortLinks(): Promise<void> {
    const result = await this.shortLinkRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    if (result.affected) {
      this.logger.log(`Purged ${result.affected} expired short link(s)`);
    }
  }
}
