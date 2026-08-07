import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('short_links')
export class ShortLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Short redirect code, e.g. 7 chars — column is wider than what's
  // generated to leave headroom without a migration if that ever changes.
  @Column({ type: 'varchar', length: 12, unique: true })
  code: string;

  @Column({ type: 'text' })
  targetUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  // null = never expires — only reachable via the admin-token path in
  // UrlShortenerService.createShortLink, never offered as a public UI option.
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  // SHA-256 hex of the delete token. The raw token is returned once at
  // creation and never stored, so a DB read alone can't be used to delete.
  @Column({ type: 'varchar', length: 64 })
  deleteTokenHash: string;
}
