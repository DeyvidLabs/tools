import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShortLink } from '../../common/entities/short-link.entity';
import { UrlShortenerController } from './url-shortener.controller';
import { UrlShortenerService } from './url-shortener.service';
import { UrlShortenerCleanupService } from './url-shortener-cleanup.service';

@Module({
  imports: [TypeOrmModule.forFeature([ShortLink])],
  controllers: [UrlShortenerController],
  providers: [UrlShortenerService, UrlShortenerCleanupService],
})
export class UrlShortenerModule {}
