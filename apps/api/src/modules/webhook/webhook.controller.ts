import {
  All,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { WebhookBin } from '../../common/entities/webhook-bin.entity';
import { WebhookRequest } from '../../common/entities/webhook-request.entity';
import { WebhookBinDto, WebhookRequestDto } from '../../common/dto/webhook.dto';
import { WebhookService } from './webhook.service';

@ApiTags('webhook')
@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Public()
  @Post('bins')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new webhook bin' })
  @ApiCreatedResponse({ description: 'Bin created', type: WebhookBinDto })
  createBin(): Promise<WebhookBin> {
    return this.webhookService.createBin();
  }

  @Public()
  @Get('bins/:id')
  @ApiOperation({ summary: 'Fetch a webhook bin (404 if missing or expired)' })
  @ApiOkResponse({ description: 'Bin found', type: WebhookBinDto })
  getBin(@Param('id', ParseUUIDPipe) id: string): Promise<WebhookBin> {
    return this.webhookService.getBin(id);
  }

  @Public()
  @Get('bins/:id/requests')
  @ApiOperation({ summary: 'List requests captured by a bin, newest first' })
  @ApiOkResponse({
    description: 'Captured requests',
    type: [WebhookRequestDto],
  })
  listRequests(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WebhookRequest[]> {
    return this.webhookService.listRequests(id);
  }

  @Public()
  @All('capture/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Capture endpoint — send any HTTP request here to record it in the bin',
  })
  @ApiOkResponse({ description: 'Request captured' })
  async capture(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<{ captured: boolean }> {
    const contentType = req.headers['content-type'] ?? null;
    await this.webhookService.capture(id, {
      method: req.method,
      headers: req.headers as Record<string, string | string[]>,
      query: req.query,
      contentType,
      rawBody: req.body as Buffer | undefined,
      sourceIp: req.ip ?? null,
    });
    return { captured: true };
  }
}
