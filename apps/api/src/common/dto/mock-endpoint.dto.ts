import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export const MIN_STATUS_CODE = 100;
export const MAX_STATUS_CODE = 599;
export const MAX_DELAY_MS = 30_000;
export const DEFAULT_STATUS_CODE = 200;

export class CreateMockEndpointDto {
  @ApiProperty({
    required: false,
    minimum: MIN_STATUS_CODE,
    maximum: MAX_STATUS_CODE,
    default: DEFAULT_STATUS_CODE,
    description: 'HTTP status code the hit route responds with',
  })
  @IsOptional()
  @IsInt()
  @Min(MIN_STATUS_CODE)
  @Max(MAX_STATUS_CODE)
  statusCode?: number;

  @ApiProperty({
    required: false,
    description: 'Any JSON value sent back as the response body (omit for an empty body)',
  })
  @IsOptional()
  responseBody?: unknown;

  @ApiProperty({
    required: false,
    type: Object,
    additionalProperties: { type: 'string' },
    description: 'Extra response headers, e.g. { "X-Rate-Limit-Remaining": "0" }',
  })
  @IsOptional()
  @IsObject()
  responseHeaders?: Record<string, string>;

  @ApiProperty({
    required: false,
    minimum: 0,
    maximum: MAX_DELAY_MS,
    default: 0,
    description: 'Milliseconds to wait before responding, for simulating a slow backend',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_DELAY_MS)
  delayMs?: number;
}

export class DeleteMockEndpointDto {
  @ApiProperty({ description: 'The one-time delete token returned at creation' })
  @IsString()
  deleteToken: string;
}

export class MockEndpointDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  statusCode: number;

  @ApiProperty({ nullable: true })
  responseBody: unknown;

  @ApiProperty()
  responseHeaders: Record<string, string>;

  @ApiProperty()
  delayMs: number;
}

export class CreateMockEndpointResponseDto extends MockEndpointDto {
  @ApiProperty({ description: 'One-time delete token — shown only in this response' })
  deleteToken: string;
}
