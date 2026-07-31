import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookBin } from '../../common/entities/webhook-bin.entity';
import { WebhookRequest } from '../../common/entities/webhook-request.entity';

function buildBin(overrides: Partial<WebhookBin> = {}): WebhookBin {
  const bin = new WebhookBin();
  bin.id = 'bin-uuid-1';
  bin.createdAt = new Date('2026-01-01T00:00:00Z');
  bin.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  bin.requests = [];
  return Object.assign(bin, overrides);
}

const mockBinRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockRequestRepository = {
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
  delete: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('WebhookService', () => {
  let service: WebhookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: getRepositoryToken(WebhookBin),
          useValue: mockBinRepository,
        },
        {
          provide: getRepositoryToken(WebhookRequest),
          useValue: mockRequestRepository,
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBin', () => {
    it('sets expiresAt using the configured TTL', async () => {
      mockConfigService.get.mockReturnValue(2);
      const created = buildBin();
      let capturedArg: { expiresAt: Date } | undefined;
      mockBinRepository.create.mockImplementation(
        (arg: { expiresAt: Date }) => {
          capturedArg = arg;
          return created;
        },
      );
      mockBinRepository.save.mockResolvedValue(created);

      const before = Date.now();
      const result = await service.createBin();
      const after = Date.now();

      expect(mockConfigService.get).toHaveBeenCalledWith(
        'WEBHOOK_BIN_TTL_HOURS',
      );
      const expiresAt = capturedArg?.expiresAt.getTime() ?? 0;
      expect(expiresAt).toBeGreaterThanOrEqual(before + 2 * 60 * 60 * 1000);
      expect(expiresAt).toBeLessThanOrEqual(after + 2 * 60 * 60 * 1000);
      expect(result).toEqual(created);
    });

    it('falls back to a 24h TTL when unconfigured', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      const created = buildBin();
      let capturedArg: { expiresAt: Date } | undefined;
      mockBinRepository.create.mockImplementation(
        (arg: { expiresAt: Date }) => {
          capturedArg = arg;
          return created;
        },
      );
      mockBinRepository.save.mockResolvedValue(created);

      await service.createBin();

      const ttlMs = (capturedArg?.expiresAt.getTime() ?? 0) - Date.now();
      expect(ttlMs).toBeGreaterThan(23 * 60 * 60 * 1000);
      expect(ttlMs).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    });
  });

  describe('getBin', () => {
    it('returns the bin when it exists and has not expired', async () => {
      const bin = buildBin();
      mockBinRepository.findOne.mockResolvedValue(bin);

      const result = await service.getBin(bin.id);

      expect(result).toEqual(bin);
    });

    it('throws NotFoundException when the bin does not exist', async () => {
      mockBinRepository.findOne.mockResolvedValue(null);

      await expect(service.getBin('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when the bin has expired', async () => {
      const expired = buildBin({ expiresAt: new Date(Date.now() - 1000) });
      mockBinRepository.findOne.mockResolvedValue(expired);

      await expect(service.getBin(expired.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listRequests', () => {
    it('404s via getBin before listing when the bin is gone', async () => {
      mockBinRepository.findOne.mockResolvedValue(null);

      await expect(service.listRequests('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRequestRepository.find).not.toHaveBeenCalled();
    });

    it('returns requests ordered newest first', async () => {
      const bin = buildBin();
      mockBinRepository.findOne.mockResolvedValue(bin);
      const requests = [{ id: 'req-2' }, { id: 'req-1' }];
      mockRequestRepository.find.mockResolvedValue(requests);

      const result = await service.listRequests(bin.id);

      expect(mockRequestRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { binId: bin.id },
          order: { receivedAt: 'DESC' },
        }),
      );
      expect(result).toEqual(requests);
    });
  });

  describe('capture', () => {
    it('404s when the target bin is missing or expired', async () => {
      mockBinRepository.findOne.mockResolvedValue(null);

      await expect(
        service.capture('missing', {
          method: 'POST',
          headers: {},
          query: {},
          contentType: null,
          rawBody: undefined,
          sourceIp: null,
        }),
      ).rejects.toThrow(NotFoundException);
      expect(mockRequestRepository.save).not.toHaveBeenCalled();
    });

    it('stores a UTF-8 body as-is and does not trim when under the cap', async () => {
      const bin = buildBin();
      mockBinRepository.findOne.mockResolvedValue(bin);
      mockRequestRepository.create.mockImplementation((v: unknown) => v);
      mockRequestRepository.save.mockResolvedValue({});
      mockRequestRepository.count.mockResolvedValue(1);

      await service.capture(bin.id, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        query: { a: '1' },
        contentType: 'application/json',
        rawBody: Buffer.from('{"hello":"world"}', 'utf8'),
        sourceIp: '203.0.113.1',
      });

      expect(mockRequestRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          binId: bin.id,
          method: 'POST',
          body: '{"hello":"world"}',
          bodyEncoding: 'utf8',
          sourceIp: '203.0.113.1',
        }),
      );
      expect(mockRequestRepository.delete).not.toHaveBeenCalled();
    });

    it('base64-encodes a body that is not valid UTF-8', async () => {
      const bin = buildBin();
      mockBinRepository.findOne.mockResolvedValue(bin);
      mockRequestRepository.create.mockImplementation((v: unknown) => v);
      mockRequestRepository.save.mockResolvedValue({});
      mockRequestRepository.count.mockResolvedValue(1);

      const binaryBody = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x10]);
      await service.capture(bin.id, {
        method: 'POST',
        headers: {},
        query: {},
        contentType: 'application/octet-stream',
        rawBody: binaryBody,
        sourceIp: null,
      });

      expect(mockRequestRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          body: binaryBody.toString('base64'),
          bodyEncoding: 'base64',
        }),
      );
    });

    it('trims the oldest requests once the bin exceeds the cap', async () => {
      const bin = buildBin();
      mockBinRepository.findOne.mockResolvedValue(bin);
      mockRequestRepository.create.mockImplementation((v: unknown) => v);
      mockRequestRepository.save.mockResolvedValue({});
      mockRequestRepository.count.mockResolvedValue(103);
      mockRequestRepository.find.mockResolvedValue([
        { id: 'oldest-1' },
        { id: 'oldest-2' },
        { id: 'oldest-3' },
      ]);

      await service.capture(bin.id, {
        method: 'GET',
        headers: {},
        query: {},
        contentType: null,
        rawBody: undefined,
        sourceIp: null,
      });

      expect(mockRequestRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { binId: bin.id },
          order: { receivedAt: 'ASC' },
          take: 3,
        }),
      );
      expect(mockRequestRepository.delete).toHaveBeenCalledWith([
        'oldest-1',
        'oldest-2',
        'oldest-3',
      ]);
    });
  });
});
