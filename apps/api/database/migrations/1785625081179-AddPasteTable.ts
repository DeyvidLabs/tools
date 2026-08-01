import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasteTable1785625081179 implements MigrationInterface {
    name = 'AddPasteTable1785625081179'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "pastes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(200), "content" text NOT NULL, "language" character varying(40), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "expiresAt" TIMESTAMP WITH TIME ZONE, "deleteTokenHash" character varying(64) NOT NULL, CONSTRAINT "PK_2c805f81f77079615df0bdc6c1e" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "pastes"`);
    }

}
