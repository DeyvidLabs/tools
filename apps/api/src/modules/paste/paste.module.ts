import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paste } from '../../common/entities/paste.entity';
import { PasteController } from './paste.controller';
import { PasteService } from './paste.service';
import { PasteCleanupService } from './paste-cleanup.service';

@Module({
  imports: [TypeOrmModule.forFeature([Paste])],
  controllers: [PasteController],
  providers: [PasteService, PasteCleanupService],
})
export class PasteModule {}
