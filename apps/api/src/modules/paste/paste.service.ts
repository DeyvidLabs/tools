import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { Paste } from '../../common/entities/paste.entity';
import { CreatePasteDto, PasteExpiration } from '../../common/dto/paste.dto';

const EXPIRATION_MS: Record<Exclude<PasteExpiration, 'never'>, number> = {
  '1h': 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '1m': 30 * 24 * 60 * 60 * 1000,
};

export interface CreatedPaste extends Omit<Paste, 'deleteTokenHash'> {
  deleteToken: string;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class PasteService {
  constructor(
    @InjectRepository(Paste)
    private readonly pasteRepository: Repository<Paste>,
  ) {}

  async createPaste(dto: CreatePasteDto, isAdmin: boolean): Promise<CreatedPaste> {
    if (dto.expiresIn === 'never' && !isAdmin) {
      throw new ForbiddenException(
        'A never-expiring paste requires a valid admin token',
      );
    }

    const expiresAt =
      dto.expiresIn === 'never' ? null : new Date(Date.now() + EXPIRATION_MS[dto.expiresIn]);

    const deleteToken = randomBytes(32).toString('hex');
    const saved = await this.pasteRepository.save(
      this.pasteRepository.create({
        title: dto.title ?? null,
        content: dto.content,
        language: dto.language ?? null,
        expiresAt,
        deleteTokenHash: hashToken(deleteToken),
      }),
    );

    const { deleteTokenHash: _deleteTokenHash, ...pasteWithoutHash } = saved;
    return { ...pasteWithoutHash, deleteToken };
  }

  // Includes deleteTokenHash — internal use only (deletePaste's comparison).
  // The public-facing getPaste() below strips it before returning.
  private async findOrThrow(id: string): Promise<Paste> {
    const paste = await this.pasteRepository.findOne({ where: { id } });
    if (!paste || (paste.expiresAt !== null && paste.expiresAt.getTime() < Date.now())) {
      throw new NotFoundException('Paste not found or expired');
    }
    return paste;
  }

  async getPaste(id: string): Promise<Omit<Paste, 'deleteTokenHash'>> {
    const { deleteTokenHash: _deleteTokenHash, ...paste } = await this.findOrThrow(id);
    return paste;
  }

  async deletePaste(id: string, token: string): Promise<void> {
    const paste = await this.findOrThrow(id);

    const providedHash = Buffer.from(hashToken(token));
    const storedHash = Buffer.from(paste.deleteTokenHash);
    if (providedHash.length !== storedHash.length || !timingSafeEqual(providedHash, storedHash)) {
      throw new ForbiddenException('Invalid delete token');
    }

    await this.pasteRepository.delete(id);
  }
}
