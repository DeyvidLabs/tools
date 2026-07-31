import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { WebhookBin } from '../../common/entities/webhook-bin.entity';
import { WebhookRequest } from '../../common/entities/webhook-request.entity';

const DEFAULT_TTL_HOURS = 24;
const MAX_REQUESTS_PER_BIN = 100;

export interface CapturedRequestInput {
  method: string;
  headers: Record<string, string | string[]>;
  query: Record<string, unknown>;
  contentType: string | null;
  rawBody: Buffer | undefined;
  sourceIp: string | null;
}

@Injectable()
export class WebhookService {
  constructor(
    @InjectRepository(WebhookBin)
    private readonly binRepository: Repository<WebhookBin>,
    @InjectRepository(WebhookRequest)
    private readonly requestRepository: Repository<WebhookRequest>,
    private readonly configService: ConfigService,
  ) {}

  async createBin(): Promise<WebhookBin> {
    const ttlHours =
      this.configService.get<number>('WEBHOOK_BIN_TTL_HOURS') ??
      DEFAULT_TTL_HOURS;
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    return this.binRepository.save(this.binRepository.create({ expiresAt }));
  }

  async getBin(id: string): Promise<WebhookBin> {
    const bin = await this.binRepository.findOne({ where: { id } });
    if (!bin || bin.expiresAt.getTime() < Date.now()) {
      throw new NotFoundException('Webhook bin not found or expired');
    }
    return bin;
  }

  async listRequests(binId: string): Promise<WebhookRequest[]> {
    await this.getBin(binId);
    return this.requestRepository.find({
      where: { binId },
      order: { receivedAt: 'DESC' },
      take: MAX_REQUESTS_PER_BIN,
    });
  }

  async capture(binId: string, input: CapturedRequestInput): Promise<void> {
    await this.getBin(binId);

    const { body, bodyEncoding } = encodeBody(input.rawBody);
    await this.requestRepository.save(
      this.requestRepository.create({
        binId,
        method: input.method,
        headers: input.headers,
        query: input.query,
        contentType: input.contentType,
        body,
        bodyEncoding,
        sourceIp: input.sourceIp,
      }),
    );

    await this.trimToNewest(binId);
  }

  // Public, unauthenticated endpoint — cap how many requests a single bin can
  // accumulate so one bin can't grow the table unbounded.
  private async trimToNewest(binId: string): Promise<void> {
    const total = await this.requestRepository.count({ where: { binId } });
    const excess = total - MAX_REQUESTS_PER_BIN;
    if (excess <= 0) return;

    const oldest = await this.requestRepository.find({
      where: { binId },
      order: { receivedAt: 'ASC' },
      take: excess,
      select: { id: true },
    });
    await this.requestRepository.delete(oldest.map((r) => r.id));
  }
}

// Stores UTF-8-safe text as-is; anything that doesn't round-trip cleanly
// (binary payloads) is base64-encoded instead, flagged via `bodyEncoding`.
function encodeBody(rawBody: Buffer | undefined): {
  body: string | null;
  bodyEncoding: 'utf8' | 'base64';
} {
  if (!rawBody || rawBody.length === 0) {
    return { body: null, bodyEncoding: 'utf8' };
  }
  const asText = rawBody.toString('utf8');
  if (Buffer.from(asText, 'utf8').equals(rawBody)) {
    return { body: asText, bodyEncoding: 'utf8' };
  }
  return { body: rawBody.toString('base64'), bodyEncoding: 'base64' };
}
