import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { UrlShortenerService } from './url-shortener.service';
import { ShortLink } from '../../common/entities/short-link.entity';
import { CreateShortLinkDto } from '../../common/dto/short-link.dto';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function buildLink(overrides: Partial<ShortLink> = {}): ShortLink {
  const link = new ShortLink();
  link.id = 'link-uuid-1';
  link.code = 'aB3dK9x';
  link.targetUrl = 'https://example.com/some/path';
  link.createdAt = new Date('2026-01-01T00:00:00Z');
  link.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  link.deleteTokenHash = hashToken('correct-token');
  return Object.assign(link, overrides);
}

function buildDto(overrides: Partial<CreateShortLinkDto> = {}): CreateShortLinkDto {
  return { targetUrl: 'https://example.com/some/path', expiresIn: '1h', ...overrides };
}

const mockShortLinkRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

describe('UrlShortenerService', () => {
  let service: UrlShortenerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlShortenerService,
        { provide: getRepositoryToken(ShortLink), useValue: mockShortLinkRepository },
      ],
    }).compile();

    service = module.get<UrlShortenerService>(UrlShortenerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createShortLink', () => {
    it.each([
      ['1h', 60 * 60 * 1000],
      ['1d', 24 * 60 * 60 * 1000],
      ['1w', 7 * 24 * 60 * 60 * 1000],
      ['1m', 30 * 24 * 60 * 60 * 1000],
    ] as const)('sets expiresAt %s from now', async (expiresIn, ttlMs) => {
      mockShortLinkRepository.findOne.mockResolvedValue(null);
      let capturedArg: { expiresAt: Date | null } | undefined;
      mockShortLinkRepository.create.mockImplementation((arg: { expiresAt: Date | null }) => {
        capturedArg = arg;
        return arg;
      });
      mockShortLinkRepository.save.mockImplementation((arg: ShortLink) => ({
        ...arg,
        id: 'new-id',
      }));

      const before = Date.now();
      await service.createShortLink(buildDto({ expiresIn }), false);
      const after = Date.now();

      const expiresAt = capturedArg?.expiresAt?.getTime() ?? 0;
      expect(expiresAt).toBeGreaterThanOrEqual(before + ttlMs);
      expect(expiresAt).toBeLessThanOrEqual(after + ttlMs);
    });

    it('rejects a "never" expiration when the caller is not admin', async () => {
      await expect(
        service.createShortLink(buildDto({ expiresIn: 'never' }), false),
      ).rejects.toThrow(ForbiddenException);
      expect(mockShortLinkRepository.save).not.toHaveBeenCalled();
    });

    it('allows a "never" expiration when the caller is admin', async () => {
      mockShortLinkRepository.findOne.mockResolvedValue(null);
      let capturedArg: { expiresAt: Date | null } | undefined;
      mockShortLinkRepository.create.mockImplementation((arg: { expiresAt: Date | null }) => {
        capturedArg = arg;
        return arg;
      });
      mockShortLinkRepository.save.mockImplementation((arg: ShortLink) => ({
        ...arg,
        id: 'new-id',
      }));

      await service.createShortLink(buildDto({ expiresIn: 'never' }), true);

      expect(capturedArg?.expiresAt).toBeNull();
    });

    it('returns a raw delete token but stores only its hash, and never leaks the hash', async () => {
      mockShortLinkRepository.findOne.mockResolvedValue(null);
      let capturedArg: { deleteTokenHash: string } | undefined;
      mockShortLinkRepository.create.mockImplementation((arg: { deleteTokenHash: string }) => {
        capturedArg = arg;
        return arg;
      });
      mockShortLinkRepository.save.mockImplementation((arg: ShortLink) => ({
        ...arg,
        id: 'new-id',
      }));

      const result = await service.createShortLink(buildDto(), false);

      expect(result.deleteToken).toEqual(expect.any(String));
      expect(capturedArg?.deleteTokenHash).toBe(hashToken(result.deleteToken));
      expect(result).not.toHaveProperty('deleteTokenHash');
    });

    it('retries code generation on collision until a free one is found', async () => {
      mockShortLinkRepository.findOne
        .mockResolvedValueOnce(buildLink()) // first generated code taken
        .mockResolvedValueOnce(null); // second is free
      mockShortLinkRepository.create.mockImplementation((arg) => arg);
      mockShortLinkRepository.save.mockImplementation((arg: ShortLink) => ({
        ...arg,
        id: 'new-id',
      }));

      await service.createShortLink(buildDto(), false);

      expect(mockShortLinkRepository.findOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('getShortLink', () => {
    it('returns the short link without the delete token hash when found and not expired', async () => {
      const link = buildLink();
      mockShortLinkRepository.findOne.mockResolvedValue(link);

      const result = await service.getShortLink(link.code);

      expect(result).not.toHaveProperty('deleteTokenHash');
      expect(result.code).toBe(link.code);
    });

    it('throws NotFoundException when the short link does not exist', async () => {
      mockShortLinkRepository.findOne.mockResolvedValue(null);

      await expect(service.getShortLink('missing')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the short link has expired', async () => {
      const expired = buildLink({ expiresAt: new Date(Date.now() - 1000) });
      mockShortLinkRepository.findOne.mockResolvedValue(expired);

      await expect(service.getShortLink(expired.code)).rejects.toThrow(NotFoundException);
    });

    it('never expires when expiresAt is null', async () => {
      const permanent = buildLink({ expiresAt: null });
      mockShortLinkRepository.findOne.mockResolvedValue(permanent);

      const result = await service.getShortLink(permanent.code);

      expect(result.code).toBe(permanent.code);
    });
  });

  describe('resolve', () => {
    it('returns the target URL for a valid code', async () => {
      const link = buildLink();
      mockShortLinkRepository.findOne.mockResolvedValue(link);

      await expect(service.resolve(link.code)).resolves.toBe(link.targetUrl);
    });

    it('throws NotFoundException for a missing or expired code', async () => {
      mockShortLinkRepository.findOne.mockResolvedValue(null);

      await expect(service.resolve('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteShortLink', () => {
    it('deletes the short link when the token matches', async () => {
      const link = buildLink();
      mockShortLinkRepository.findOne.mockResolvedValue(link);

      await service.deleteShortLink(link.code, 'correct-token');

      expect(mockShortLinkRepository.delete).toHaveBeenCalledWith(link.id);
    });

    it('throws ForbiddenException when the token does not match, without deleting', async () => {
      const link = buildLink();
      mockShortLinkRepository.findOne.mockResolvedValue(link);

      await expect(service.deleteShortLink(link.code, 'wrong-token')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockShortLinkRepository.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException before checking the token when the short link is missing', async () => {
      mockShortLinkRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteShortLink('missing', 'any-token')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockShortLinkRepository.delete).not.toHaveBeenCalled();
    });
  });
});
