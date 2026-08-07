import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { Response } from 'express';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ShortLink } from '../../common/entities/short-link.entity';
import {
  CreateShortLinkDto,
  CreateShortLinkResponseDto,
  DeleteShortLinkDto,
  ShortLinkDto,
} from '../../common/dto/short-link.dto';
import { CreatedShortLink, UrlShortenerService } from './url-shortener.service';

@ApiTags('url-shortener')
@Controller()
export class UrlShortenerController {
  constructor(
    private readonly urlShortenerService: UrlShortenerService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('shorten')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a short link' })
  @ApiCreatedResponse({ description: 'Short link created', type: CreateShortLinkResponseDto })
  createShortLink(
    @Body() dto: CreateShortLinkDto,
    @Headers('x-shortener-admin-token') adminToken?: string,
  ): Promise<CreatedShortLink> {
    return this.urlShortenerService.createShortLink(dto, this.isAdmin(adminToken));
  }

  @Public()
  @Get('shorten/:code')
  @ApiOperation({ summary: 'Fetch a short link (404 if missing or expired)' })
  @ApiOkResponse({ description: 'Short link found', type: ShortLinkDto })
  getShortLink(@Param('code') code: string): Promise<Omit<ShortLink, 'deleteTokenHash'>> {
    return this.urlShortenerService.getShortLink(code);
  }

  @Public()
  @Delete('shorten/:code')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a short link using its one-time delete token' })
  @ApiNoContentResponse({ description: 'Short link deleted' })
  deleteShortLink(
    @Param('code') code: string,
    @Body() dto: DeleteShortLinkDto,
  ): Promise<void> {
    return this.urlShortenerService.deleteShortLink(code, dto.deleteToken);
  }

  // Real HTTP redirect (not a JSON body) so this also works for curl and
  // crawlers, not just browser JS — same @Res()-bypasses-the-pipeline
  // pattern as AuthController's googleAuthRedirect.
  @Public()
  @Get('s/:code')
  @ApiOperation({ summary: 'Redirect to the target URL for a short code' })
  async redirect(@Param('code') code: string, @Res() res: Response): Promise<void> {
    try {
      const targetUrl = await this.urlShortenerService.resolve(code);
      res.redirect(HttpStatus.FOUND, targetUrl);
    } catch {
      res.status(HttpStatus.NOT_FOUND).type('text/plain').send('Short link not found or expired.');
    }
  }

  // Timing-safe: an early-return `!==` comparison here would let an attacker
  // infer the configured token byte-by-byte from response latency.
  private isAdmin(providedToken: string | undefined): boolean {
    const configuredToken = this.configService.get<string>('URL_SHORTENER_ADMIN_TOKEN');
    if (!configuredToken || !providedToken) return false;

    const provided = Buffer.from(providedToken);
    const configured = Buffer.from(configuredToken);
    return provided.length === configured.length && timingSafeEqual(provided, configured);
  }
}
