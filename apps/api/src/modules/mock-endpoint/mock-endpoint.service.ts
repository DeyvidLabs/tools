import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { MockEndpoint } from '../../common/entities/mock-endpoint.entity';
import { CreateMockEndpointDto, DEFAULT_STATUS_CODE } from '../../common/dto/mock-endpoint.dto';

const DEFAULT_TTL_HOURS = 24;

// Headers Node/Express compute from the body and connection state — letting
// a configured mock override them risks a mismatched Content-Length or a
// broken keep-alive that corrupts framing for the client under test.
// Security-relevant headers are also off limits: the hit route is served on
// the tools origin, so a mock must not be able to set cookies or loosen/
// replace the CSP (the controller re-applies its own after user headers).
export const FORBIDDEN_RESPONSE_HEADERS = new Set([
  'content-length',
  'transfer-encoding',
  'connection',
  'content-security-policy',
  'content-security-policy-report-only',
  'x-content-type-options',
  'set-cookie',
  'content-encoding',
  'content-disposition',
  'strict-transport-security',
]);

// RFC 9110 token for names; visible ASCII/obs-text, SP and HTAB for values
// (no CR/LF/NUL), so res.set can never throw ERR_INVALID_CHAR on a hit.
const HEADER_NAME_RE = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const HEADER_VALUE_RE = /^[\t\x20-\x7e\x80-\xff]*$/;

export interface CreatedMockEndpoint extends Omit<MockEndpoint, 'deleteTokenHash'> {
  deleteToken: string;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class MockEndpointService {
  constructor(
    @InjectRepository(MockEndpoint)
    private readonly mockEndpointRepository: Repository<MockEndpoint>,
    private readonly configService: ConfigService,
  ) {}

  async createEndpoint(dto: CreateMockEndpointDto): Promise<CreatedMockEndpoint> {
    const responseHeaders = this.validateHeaders(dto.responseHeaders);
    const ttlHours =
      this.configService.get<number>('MOCK_ENDPOINT_TTL_HOURS') ?? DEFAULT_TTL_HOURS;
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    const deleteToken = randomBytes(32).toString('hex');

    const saved = await this.mockEndpointRepository.save(
      this.mockEndpointRepository.create({
        expiresAt,
        statusCode: dto.statusCode ?? DEFAULT_STATUS_CODE,
        responseBody: dto.responseBody ?? null,
        responseHeaders,
        delayMs: dto.delayMs ?? 0,
        deleteTokenHash: hashToken(deleteToken),
      }),
    );

    const { deleteTokenHash: _deleteTokenHash, ...endpointWithoutHash } = saved;
    return { ...endpointWithoutHash, deleteToken };
  }

  // Includes deleteTokenHash — internal use only (deleteEndpoint's
  // comparison). The public-facing getEndpoint() below strips it.
  private async findOrThrow(id: string): Promise<MockEndpoint> {
    const endpoint = await this.mockEndpointRepository.findOne({ where: { id } });
    if (!endpoint || endpoint.expiresAt.getTime() < Date.now()) {
      throw new NotFoundException('Mock endpoint not found or expired');
    }
    return endpoint;
  }

  async getEndpoint(id: string): Promise<Omit<MockEndpoint, 'deleteTokenHash'>> {
    const { deleteTokenHash: _deleteTokenHash, ...endpoint } = await this.findOrThrow(id);
    return endpoint;
  }

  async deleteEndpoint(id: string, token: string): Promise<void> {
    const endpoint = await this.findOrThrow(id);

    const providedHash = Buffer.from(hashToken(token));
    const storedHash = Buffer.from(endpoint.deleteTokenHash);
    if (providedHash.length !== storedHash.length || !timingSafeEqual(providedHash, storedHash)) {
      throw new ForbiddenException('Invalid delete token');
    }

    await this.mockEndpointRepository.delete(endpoint.id);
  }

  private validateHeaders(headers: Record<string, string> | undefined): Record<string, string> {
    if (!headers) return {};
    for (const [key, value] of Object.entries(headers)) {
      if (typeof value !== 'string') {
        throw new BadRequestException(`Header "${key}" must be a string value`);
      }
      if (!HEADER_NAME_RE.test(key) || !HEADER_VALUE_RE.test(value)) {
        throw new BadRequestException(`Header "${key}" has an invalid name or value`);
      }
      if (FORBIDDEN_RESPONSE_HEADERS.has(key.toLowerCase())) {
        throw new BadRequestException(`Header "${key}" cannot be set on a mock endpoint`);
      }
    }
    return headers;
  }
}
