import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, randomInt, createHash, timingSafeEqual } from 'crypto';
import { ShortLink } from '../../common/entities/short-link.entity';
import { CreateShortLinkDto, ShortLinkExpiration } from '../../common/dto/short-link.dto';

const EXPIRATION_MS: Record<Exclude<ShortLinkExpiration, 'never'>, number> = {
  '1h': 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '1m': 30 * 24 * 60 * 60 * 1000,
};

// Unambiguous-enough alphanumeric alphabet; 62^7 ≈ 3.5e12 possible codes,
// so the retry loop in generateUniqueCode below only exists for the
// astronomically unlikely collision, not as the primary defense.
const CODE_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const CODE_LENGTH = 7;
const MAX_CODE_ATTEMPTS = 5;

export interface CreatedShortLink extends Omit<ShortLink, 'deleteTokenHash'> {
  deleteToken: string;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateCode(): string {
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return out;
}

@Injectable()
export class UrlShortenerService {
  constructor(
    @InjectRepository(ShortLink)
    private readonly shortLinkRepository: Repository<ShortLink>,
  ) {}

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const code = generateCode();
      const existing = await this.shortLinkRepository.findOne({ where: { code } });
      if (!existing) return code;
    }
    throw new InternalServerErrorException('Could not generate a unique short code');
  }

  async createShortLink(dto: CreateShortLinkDto, isAdmin: boolean): Promise<CreatedShortLink> {
    if (dto.expiresIn === 'never' && !isAdmin) {
      throw new ForbiddenException(
        'A never-expiring short link requires a valid admin token',
      );
    }

    const expiresAt =
      dto.expiresIn === 'never' ? null : new Date(Date.now() + EXPIRATION_MS[dto.expiresIn]);

    const code = await this.generateUniqueCode();
    const deleteToken = randomBytes(32).toString('hex');
    const saved = await this.shortLinkRepository.save(
      this.shortLinkRepository.create({
        code,
        targetUrl: dto.targetUrl,
        expiresAt,
        deleteTokenHash: hashToken(deleteToken),
      }),
    );

    const { deleteTokenHash: _deleteTokenHash, ...linkWithoutHash } = saved;
    return { ...linkWithoutHash, deleteToken };
  }

  // Includes deleteTokenHash — internal use only (deleteShortLink's
  // comparison and resolve's redirect target). The public-facing
  // getShortLink() below strips it before returning.
  private async findOrThrow(code: string): Promise<ShortLink> {
    const link = await this.shortLinkRepository.findOne({ where: { code } });
    if (!link || (link.expiresAt !== null && link.expiresAt.getTime() < Date.now())) {
      throw new NotFoundException('Short link not found or expired');
    }
    return link;
  }

  async getShortLink(code: string): Promise<Omit<ShortLink, 'deleteTokenHash'>> {
    const { deleteTokenHash: _deleteTokenHash, ...link } = await this.findOrThrow(code);
    return link;
  }

  async resolve(code: string): Promise<string> {
    const link = await this.findOrThrow(code);
    return link.targetUrl;
  }

  async deleteShortLink(code: string, token: string): Promise<void> {
    const link = await this.findOrThrow(code);

    const providedHash = Buffer.from(hashToken(token));
    const storedHash = Buffer.from(link.deleteTokenHash);
    if (providedHash.length !== storedHash.length || !timingSafeEqual(providedHash, storedHash)) {
      throw new ForbiddenException('Invalid delete token');
    }

    await this.shortLinkRepository.delete(link.id);
  }
}
