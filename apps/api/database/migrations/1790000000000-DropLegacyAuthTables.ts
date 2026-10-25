import { MigrationInterface, QueryRunner } from "typeorm";

// Auth was removed from the app; these tables from InitSchema are dead.
export class DropLegacyAuthTables1790000000000 implements MigrationInterface {
    name = 'DropLegacyAuthTables1790000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "user_permissions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    }

    public async down(): Promise<void> {
        // Not restored: the auth feature no longer exists. Re-run InitSchema's up() if ever needed.
    }
}
