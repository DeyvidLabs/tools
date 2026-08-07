import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThan, Repository } from 'typeorm';
import { MockEndpoint } from '../../common/entities/mock-endpoint.entity';

@Injectable()
export class MockEndpointCleanupService {
  private readonly logger = new Logger(MockEndpointCleanupService.name);

  constructor(
    @InjectRepository(MockEndpoint)
    private readonly mockEndpointRepository: Repository<MockEndpoint>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async purgeExpiredEndpoints(): Promise<void> {
    const result = await this.mockEndpointRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    if (result.affected) {
      this.logger.log(`Purged ${result.affected} expired mock endpoint(s)`);
    }
  }
}
