import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWebhookTables1785503999724 implements MigrationInterface {
    name = 'AddWebhookTables1785503999724'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "webhook_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "binId" uuid NOT NULL, "method" character varying(10) NOT NULL, "headers" jsonb NOT NULL, "query" jsonb NOT NULL, "contentType" character varying(255), "body" text, "bodyEncoding" character varying(10) NOT NULL DEFAULT 'utf8', "sourceIp" character varying(64), "receivedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dfae0971cfd5483988c5d599211" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0443186640970ea021afe482bf" ON "webhook_requests"  ("binId") `);
        await queryRunner.query(`CREATE TABLE "webhook_bins" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_eaea7aade391b797b743f426edd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "webhook_requests" ADD CONSTRAINT "FK_0443186640970ea021afe482bf6" FOREIGN KEY ("binId") REFERENCES "webhook_bins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "webhook_requests" DROP CONSTRAINT "FK_0443186640970ea021afe482bf6"`);
        await queryRunner.query(`DROP TABLE "webhook_bins"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0443186640970ea021afe482bf"`);
        await queryRunner.query(`DROP TABLE "webhook_requests"`);
    }

}
