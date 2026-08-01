import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PasteService } from './paste.service';
import { Paste } from '../../common/entities/paste.entity';
import { CreatePasteDto } from '../../common/dto/paste.dto';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function buildPaste(overrides: Partial<Paste> = {}): Paste {
  const paste = new Paste();
  paste.id = 'paste-uuid-1';
  paste.title = 'Title';
  paste.content = 'hello world';
  paste.language = 'text';
  paste.createdAt = new Date('2026-01-01T00:00:00Z');
  paste.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  paste.deleteTokenHash = hashToken('correct-token');
  return Object.assign(paste, overrides);
}

function buildDto(overrides: Partial<CreatePasteDto> = {}): CreatePasteDto {
  return { content: 'hello world', expiresIn: '1h', ...overrides };
}

const mockPasteRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

describe('PasteService', () => {
  let service: PasteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasteService,
        { provide: getRepositoryToken(Paste), useValue: mockPasteRepository },
      ],
    }).compile();

    service = module.get<PasteService>(PasteService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaste', () => {
    it.each([
      ['1h', 60 * 60 * 1000],
      ['1d', 24 * 60 * 60 * 1000],
      ['1w', 7 * 24 * 60 * 60 * 1000],
      ['1m', 30 * 24 * 60 * 60 * 1000],
    ] as const)('sets expiresAt %s from now', async (expiresIn, ttlMs) => {
      let capturedArg: { expiresAt: Date | null } | undefined;
      mockPasteRepository.create.mockImplementation((arg: { expiresAt: Date | null }) => {
        capturedArg = arg;
        return arg;
      });
      mockPasteRepository.save.mockImplementation((arg: Paste) => ({
        ...arg,
        id: 'new-id',
      }));

      const before = Date.now();
      await service.createPaste(buildDto({ expiresIn }), false);
      const after = Date.now();

      const expiresAt = capturedArg?.expiresAt?.getTime() ?? 0;
      expect(expiresAt).toBeGreaterThanOrEqual(before + ttlMs);
      expect(expiresAt).toBeLessThanOrEqual(after + ttlMs);
    });

    it('rejects a "never" expiration when the caller is not admin', async () => {
      await expect(
        service.createPaste(buildDto({ expiresIn: 'never' }), false),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPasteRepository.save).not.toHaveBeenCalled();
    });

    it('allows a "never" expiration when the caller is admin', async () => {
      let capturedArg: { expiresAt: Date | null } | undefined;
      mockPasteRepository.create.mockImplementation((arg: { expiresAt: Date | null }) => {
        capturedArg = arg;
        return arg;
      });
      mockPasteRepository.save.mockImplementation((arg: Paste) => ({
        ...arg,
        id: 'new-id',
      }));

      await service.createPaste(buildDto({ expiresIn: 'never' }), true);

      expect(capturedArg?.expiresAt).toBeNull();
    });

    it('returns a raw delete token but stores only its hash, and never leaks the hash', async () => {
      let capturedArg: { deleteTokenHash: string } | undefined;
      mockPasteRepository.create.mockImplementation((arg: { deleteTokenHash: string }) => {
        capturedArg = arg;
        return arg;
      });
      mockPasteRepository.save.mockImplementation((arg: Paste) => ({
        ...arg,
        id: 'new-id',
      }));

      const result = await service.createPaste(buildDto(), false);

      expect(result.deleteToken).toEqual(expect.any(String));
      expect(capturedArg?.deleteTokenHash).toBe(hashToken(result.deleteToken));
      expect(result).not.toHaveProperty('deleteTokenHash');
    });
  });

  describe('getPaste', () => {
    it('returns the paste without the delete token hash when found and not expired', async () => {
      const paste = buildPaste();
      mockPasteRepository.findOne.mockResolvedValue(paste);

      const result = await service.getPaste(paste.id);

      expect(result).not.toHaveProperty('deleteTokenHash');
      expect(result.id).toBe(paste.id);
    });

    it('throws NotFoundException when the paste does not exist', async () => {
      mockPasteRepository.findOne.mockResolvedValue(null);

      await expect(service.getPaste('missing')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the paste has expired', async () => {
      const expired = buildPaste({ expiresAt: new Date(Date.now() - 1000) });
      mockPasteRepository.findOne.mockResolvedValue(expired);

      await expect(service.getPaste(expired.id)).rejects.toThrow(NotFoundException);
    });

    it('never expires when expiresAt is null', async () => {
      const permanent = buildPaste({ expiresAt: null });
      mockPasteRepository.findOne.mockResolvedValue(permanent);

      const result = await service.getPaste(permanent.id);

      expect(result.id).toBe(permanent.id);
    });
  });

  describe('deletePaste', () => {
    it('deletes the paste when the token matches', async () => {
      const paste = buildPaste();
      mockPasteRepository.findOne.mockResolvedValue(paste);

      await service.deletePaste(paste.id, 'correct-token');

      expect(mockPasteRepository.delete).toHaveBeenCalledWith(paste.id);
    });

    it('throws ForbiddenException when the token does not match, without deleting', async () => {
      const paste = buildPaste();
      mockPasteRepository.findOne.mockResolvedValue(paste);

      await expect(service.deletePaste(paste.id, 'wrong-token')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPasteRepository.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException before checking the token when the paste is missing', async () => {
      mockPasteRepository.findOne.mockResolvedValue(null);

      await expect(service.deletePaste('missing', 'any-token')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPasteRepository.delete).not.toHaveBeenCalled();
    });
  });
});
