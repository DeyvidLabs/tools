import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, IsUrl, MaxLength } from 'class-validator';

export const SHORT_LINK_EXPIRATIONS = ['1h', '1d', '1w', '1m', 'never'] as const;
export type ShortLinkExpiration = (typeof SHORT_LINK_EXPIRATIONS)[number];

export class CreateShortLinkDto {
  @ApiProperty({
    description: 'The URL to shorten',
    maxLength: 2048,
    example: 'https://example.com/some/very/long/path',
  })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  targetUrl: string;

  @ApiProperty({
    enum: SHORT_LINK_EXPIRATIONS,
    description:
      '"never" is rejected unless the request carries a valid x-shortener-admin-token header',
  })
  @IsIn(SHORT_LINK_EXPIRATIONS)
  expiresIn: ShortLinkExpiration;
}

export class DeleteShortLinkDto {
  @ApiProperty({ description: 'The one-time delete token returned at creation' })
  @IsString()
  deleteToken: string;
}

export class ShortLinkDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  targetUrl: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true, description: 'null means the short link never expires' })
  expiresAt: Date | null;
}

export class CreateShortLinkResponseDto extends ShortLinkDto {
  @ApiProperty({ description: 'One-time delete token — shown only in this response' })
  deleteToken: string;
}
