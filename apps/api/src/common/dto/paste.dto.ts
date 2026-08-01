import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const PASTE_EXPIRATIONS = ['1h', '1d', '1w', '1m', 'never'] as const;
export type PasteExpiration = (typeof PASTE_EXPIRATIONS)[number];

export class CreatePasteDto {
  @ApiProperty({ description: 'Paste content', maxLength: 262_144 })
  @IsString()
  @MaxLength(262_144)
  content: string;

  @ApiProperty({ required: false, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiProperty({ required: false, maxLength: 40, example: 'typescript' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  language?: string;

  @ApiProperty({
    enum: PASTE_EXPIRATIONS,
    description:
      '"never" is rejected unless the request carries a valid x-paste-admin-token header',
  })
  @IsIn(PASTE_EXPIRATIONS)
  expiresIn: PasteExpiration;
}

export class DeletePasteDto {
  @ApiProperty({ description: 'The one-time delete token returned at creation' })
  @IsString()
  deleteToken: string;
}

export class PasteDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  title: string | null;

  @ApiProperty()
  content: string;

  @ApiProperty({ nullable: true })
  language: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true, description: 'null means the paste never expires' })
  expiresAt: Date | null;
}

export class CreatePasteResponseDto extends PasteDto {
  @ApiProperty({ description: 'One-time delete token — shown only in this response' })
  deleteToken: string;
}
