import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('pastes')
export class Paste {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  title: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  language: string | null;

  @CreateDateColumn()
  createdAt: Date;

  // null = never expires — only reachable via the admin-token path in
  // PasteService.createPaste, never offered as a public UI option.
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  // SHA-256 hex of the delete token. The raw token is returned once at
  // creation and never stored, so a DB read alone can't be used to delete.
  @Column({ type: 'varchar', length: 64 })
  deleteTokenHash: string;
}
