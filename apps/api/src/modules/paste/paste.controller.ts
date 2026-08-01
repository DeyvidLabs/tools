import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Paste } from '../../common/entities/paste.entity';
import {
  CreatePasteDto,
  CreatePasteResponseDto,
  DeletePasteDto,
  PasteDto,
} from '../../common/dto/paste.dto';
import { CreatedPaste, PasteService } from './paste.service';

@ApiTags('paste')
@Controller('paste')
export class PasteController {
  constructor(
    private readonly pasteService: PasteService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a paste' })
  @ApiCreatedResponse({ description: 'Paste created', type: CreatePasteResponseDto })
  createPaste(
    @Body() dto: CreatePasteDto,
    @Headers('x-paste-admin-token') adminToken?: string,
  ): Promise<CreatedPaste> {
    return this.pasteService.createPaste(dto, this.isAdmin(adminToken));
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Fetch a paste (404 if missing or expired)' })
  @ApiOkResponse({ description: 'Paste found', type: PasteDto })
  getPaste(@Param('id', ParseUUIDPipe) id: string): Promise<Omit<Paste, 'deleteTokenHash'>> {
    return this.pasteService.getPaste(id);
  }

  @Public()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a paste using its one-time delete token' })
  @ApiNoContentResponse({ description: 'Paste deleted' })
  deletePaste(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeletePasteDto,
  ): Promise<void> {
    return this.pasteService.deletePaste(id, dto.deleteToken);
  }

  // Timing-safe: an early-return `!==` comparison here would let an attacker
  // infer the configured token byte-by-byte from response latency.
  private isAdmin(providedToken: string | undefined): boolean {
    const configuredToken = this.configService.get<string>('PASTE_ADMIN_TOKEN');
    if (!configuredToken || !providedToken) return false;

    const provided = Buffer.from(providedToken);
    const configured = Buffer.from(configuredToken);
    return provided.length === configured.length && timingSafeEqual(provided, configured);
  }
}
