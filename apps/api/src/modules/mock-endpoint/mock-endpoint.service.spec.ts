import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { MockEndpointService } from './mock-endpoint.service';
import { MockEndpoint } from '../../common/entities/mock-endpoint.entity';
import { CreateMockEndpointDto } from '../../common/dto/mock-endpoint.dto';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function buildEndpoint(overrides: Partial<MockEndpoint> = {}): MockEndpoint {
  const endpoint = new MockEndpoint();
  endpoint.id = 'endpoint-uuid-1';
  endpoint.createdAt = new Date('2026-01-01T00:00:00Z');
  endpoint.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  endpoint.statusCode = 200;
  endpoint.responseBody = null;
  endpoint.responseHeaders = {};
  endpoint.delayMs = 0;
  endpoint.deleteTokenHash = hashToken('correct-token');
  return Object.assign(endpoint, overrides);
}

const mockEndpointRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('MockEndpointService', () => {
  let service: MockEndpointService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MockEndpointService,
        { provide: getRepositoryToken(MockEndpoint), useValue: mockEndpointRepository },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MockEndpointService>(MockEndpointService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createEndpoint', () => {
    it('sets expiresAt using the configured TTL', async () => {
      mockConfigService.get.mockReturnValue(2);
      const created = buildEndpoint();
      let capturedArg: { expiresAt: Date } | undefined;
      mockEndpointRepository.create.mockImplementation((arg: { expiresAt: Date }) => {
        capturedArg = arg;
        return created;
      });
      mockEndpointRepository.save.mockResolvedValue(created);

      const before = Date.now();
      await service.createEndpoint({});
      const after = Date.now();

      expect(mockConfigService.get).toHaveBeenCalledWith('MOCK_ENDPOINT_TTL_HOURS');
      const expiresAt = capturedArg?.expiresAt.getTime() ?? 0;
      expect(expiresAt).toBeGreaterThanOrEqual(before + 2 * 60 * 60 * 1000);
      expect(expiresAt).toBeLessThanOrEqual(after + 2 * 60 * 60 * 1000);
    });

    it('falls back to a 24h TTL when unconfigured', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      const created = buildEndpoint();
      let capturedArg: { expiresAt: Date } | undefined;
      mockEndpointRepository.create.mockImplementation((arg: { expiresAt: Date }) => {
        capturedArg = arg;
        return created;
      });
      mockEndpointRepository.save.mockResolvedValue(created);

      await service.createEndpoint({});

      const ttlMs = (capturedArg?.expiresAt.getTime() ?? 0) - Date.now();
      expect(ttlMs).toBeGreaterThan(23 * 60 * 60 * 1000);
      expect(ttlMs).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    });

    it('defaults statusCode to 200, responseBody to null, delayMs to 0, responseHeaders to {}', async () => {
      mockConfigService.get.mockReturnValue(24);
      let capturedArg: Partial<MockEndpoint> | undefined;
      mockEndpointRepository.create.mockImplementation((arg: Partial<MockEndpoint>) => {
        capturedArg = arg;
        return arg;
      });
      mockEndpointRepository.save.mockImplementation((arg: MockEndpoint) => ({ ...arg, id: 'new-id' }));

      await service.createEndpoint({});

      expect(capturedArg).toMatchObject({
        statusCode: 200,
        responseBody: null,
        responseHeaders: {},
        delayMs: 0,
      });
    });

    it('stores the provided statusCode, responseBody, responseHeaders, and delayMs', async () => {
      mockConfigService.get.mockReturnValue(24);
      let capturedArg: Partial<MockEndpoint> | undefined;
      mockEndpointRepository.create.mockImplementation((arg: Partial<MockEndpoint>) => {
        capturedArg = arg;
        return arg;
      });
      mockEndpointRepository.save.mockImplementation((arg: MockEndpoint) => ({ ...arg, id: 'new-id' }));

      const dto: CreateMockEndpointDto = {
        statusCode: 503,
        responseBody: { error: 'Service unavailable' },
        responseHeaders: { 'Retry-After': '30' },
        delayMs: 500,
      };
      await service.createEndpoint(dto);

      expect(capturedArg).toMatchObject({
        statusCode: 503,
        responseBody: { error: 'Service unavailable' },
        responseHeaders: { 'Retry-After': '30' },
        delayMs: 500,
      });
    });

    it('rejects a responseHeaders entry that overrides a framing-sensitive header', async () => {
      await expect(
        service.createEndpoint({ responseHeaders: { 'Content-Length': '0' } }),
      ).rejects.toThrow(BadRequestException);
      expect(mockEndpointRepository.save).not.toHaveBeenCalled();
    });

    it('returns a raw delete token but stores only its hash, and never leaks the hash', async () => {
      mockConfigService.get.mockReturnValue(24);
      let capturedArg: { deleteTokenHash: string } | undefined;
      mockEndpointRepository.create.mockImplementation((arg: { deleteTokenHash: string }) => {
        capturedArg = arg;
        return arg;
      });
      mockEndpointRepository.save.mockImplementation((arg: MockEndpoint) => ({
        ...arg,
        id: 'new-id',
      }));

      const result = await service.createEndpoint({});

      expect(result.deleteToken).toEqual(expect.any(String));
      expect(capturedArg?.deleteTokenHash).toBe(hashToken(result.deleteToken));
      expect(result).not.toHaveProperty('deleteTokenHash');
    });
  });

  describe('getEndpoint', () => {
    it('returns the endpoint without the delete token hash when found and not expired', async () => {
      const endpoint = buildEndpoint();
      mockEndpointRepository.findOne.mockResolvedValue(endpoint);

      const result = await service.getEndpoint(endpoint.id);

      expect(result).not.toHaveProperty('deleteTokenHash');
      expect(result.id).toBe(endpoint.id);
    });

    it('throws NotFoundException when the endpoint does not exist', async () => {
      mockEndpointRepository.findOne.mockResolvedValue(null);

      await expect(service.getEndpoint('missing')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the endpoint has expired', async () => {
      const expired = buildEndpoint({ expiresAt: new Date(Date.now() - 1000) });
      mockEndpointRepository.findOne.mockResolvedValue(expired);

      await expect(service.getEndpoint(expired.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteEndpoint', () => {
    it('deletes the endpoint when the token matches', async () => {
      const endpoint = buildEndpoint();
      mockEndpointRepository.findOne.mockResolvedValue(endpoint);

      await service.deleteEndpoint(endpoint.id, 'correct-token');

      expect(mockEndpointRepository.delete).toHaveBeenCalledWith(endpoint.id);
    });

    it('throws ForbiddenException when the token does not match, without deleting', async () => {
      const endpoint = buildEndpoint();
      mockEndpointRepository.findOne.mockResolvedValue(endpoint);

      await expect(service.deleteEndpoint(endpoint.id, 'wrong-token')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockEndpointRepository.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException before checking the token when the endpoint is missing', async () => {
      mockEndpointRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteEndpoint('missing', 'any-token')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockEndpointRepository.delete).not.toHaveBeenCalled();
    });
  });
});
