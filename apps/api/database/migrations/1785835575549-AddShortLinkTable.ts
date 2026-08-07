import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShortLinkTable1785835575549 implements MigrationInterface {
    name = 'AddShortLinkTable1785835575549'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "short_links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(12) NOT NULL, "targetUrl" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "expiresAt" TIMESTAMP WITH TIME ZONE, "deleteTokenHash" character varying(64) NOT NULL, CONSTRAINT "UQ_short_links_code" UNIQUE ("code"), CONSTRAINT "PK_short_links_id" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "short_links"`);
    }

}
