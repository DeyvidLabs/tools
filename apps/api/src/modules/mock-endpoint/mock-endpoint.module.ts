import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MockEndpoint } from '../../common/entities/mock-endpoint.entity';
import { MockEndpointController } from './mock-endpoint.controller';
import { MockEndpointService } from './mock-endpoint.service';
import { MockEndpointCleanupService } from './mock-endpoint-cleanup.service';

@Module({
  imports: [TypeOrmModule.forFeature([MockEndpoint])],
  controllers: [MockEndpointController],
  providers: [MockEndpointService, MockEndpointCleanupService],
})
export class MockEndpointModule {}
