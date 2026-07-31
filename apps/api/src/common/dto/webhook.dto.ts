import { ApiProperty } from '@nestjs/swagger';

export class WebhookBinDto {
  @ApiProperty({
    description: 'Bin id — also the path segment of the capture URL',
  })
  id: string;

  @ApiProperty({
    description: 'When this bin (and its captured requests) expires',
  })
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;
}

export class WebhookRequestDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'POST' })
  method: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  headers: Record<string, string | string[]>;

  @ApiProperty({ type: 'object', additionalProperties: true })
  query: Record<string, unknown>;

  @ApiProperty({ required: false, nullable: true })
  contentType: string | null;

  @ApiProperty({ required: false, nullable: true })
  body: string | null;

  @ApiProperty({ enum: ['utf8', 'base64'] })
  bodyEncoding: 'utf8' | 'base64';

  @ApiProperty({ required: false, nullable: true })
  sourceIp: string | null;

  @ApiProperty()
  receivedAt: Date;
}
