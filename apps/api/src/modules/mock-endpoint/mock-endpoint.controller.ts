import {
  All,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { MockEndpoint } from '../../common/entities/mock-endpoint.entity';
import {
  CreateMockEndpointDto,
  CreateMockEndpointResponseDto,
  DeleteMockEndpointDto,
  MockEndpointDto,
} from '../../common/dto/mock-endpoint.dto';
import { CreatedMockEndpoint, MockEndpointService } from './mock-endpoint.service';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@ApiTags('mock-endpoint')
@Controller('mock')
export class MockEndpointController {
  constructor(private readonly mockEndpointService: MockEndpointService) {}

  @Public()
  @Post('endpoints')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a configurable mock/sandbox endpoint' })
  @ApiCreatedResponse({ description: 'Mock endpoint created', type: CreateMockEndpointResponseDto })
  createEndpoint(@Body() dto: CreateMockEndpointDto): Promise<CreatedMockEndpoint> {
    return this.mockEndpointService.createEndpoint(dto);
  }

  @Public()
  @Get('endpoints/:id')
  @ApiOperation({ summary: 'Fetch a mock endpoint config (404 if missing or expired)' })
  @ApiOkResponse({ description: 'Mock endpoint found', type: MockEndpointDto })
  getEndpoint(@Param('id', ParseUUIDPipe) id: string): Promise<Omit<MockEndpoint, 'deleteTokenHash'>> {
    return this.mockEndpointService.getEndpoint(id);
  }

  @Public()
  @Delete('endpoints/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a mock endpoint using its one-time delete token' })
  @ApiNoContentResponse({ description: 'Mock endpoint deleted' })
  deleteEndpoint(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeleteMockEndpointDto,
  ): Promise<void> {
    return this.mockEndpointService.deleteEndpoint(id, dto.deleteToken);
  }

  // @Res() bypasses Nest's response pipeline: the configured status code,
  // headers, and body have to be set exactly as stored, which doesn't fit
  // decorator-based responses (those are static per-route, not per-record).
  @Public()
  @All('hit/:id')
  @ApiOperation({
    summary: 'Hit endpoint — send any request here, get back the configured status/body/headers/delay',
  })
  async hit(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response): Promise<void> {
    let endpoint: Omit<MockEndpoint, 'deleteTokenHash'>;
    try {
      endpoint = await this.mockEndpointService.getEndpoint(id);
    } catch {
      res.status(HttpStatus.NOT_FOUND).type('text/plain').send('Mock endpoint not found or expired.');
      return;
    }

    if (endpoint.delayMs > 0) {
      await sleep(endpoint.delayMs);
    }

    for (const [key, value] of Object.entries(endpoint.responseHeaders)) {
      res.set(key, value);
    }

    if (endpoint.responseBody === null || endpoint.responseBody === undefined) {
      res.status(endpoint.statusCode).end();
      return;
    }

    if (!res.get('Content-Type')) {
      res.type('application/json');
    }
    res.status(endpoint.statusCode).send(JSON.stringify(endpoint.responseBody));
  }
}
