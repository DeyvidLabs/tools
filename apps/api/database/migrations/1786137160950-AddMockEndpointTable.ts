import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMockEndpointTable1786137160950 implements MigrationInterface {
    name = 'AddMockEndpointTable1786137160950'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "mock_endpoints" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "statusCode" integer NOT NULL DEFAULT 200, "responseBody" jsonb, "responseHeaders" jsonb NOT NULL DEFAULT '{}', "delayMs" integer NOT NULL DEFAULT 0, "deleteTokenHash" character varying(64) NOT NULL, CONSTRAINT "PK_mock_endpoints_id" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "mock_endpoints"`);
    }

}
