import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDailyReturnSummaryTable2968830000000 implements MigrationInterface {
  name = 'CreateDailyReturnSummaryTable2968830000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the period_type enum
    await queryRunner.query(`
            CREATE TYPE "period_type_enum" AS ENUM ('day', 'week', 'month')
        `);

    // Create the daily_return_summary table
    await queryRunner.query(`
            CREATE TABLE "daily_return_summary" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "createdBy" uuid,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedBy" uuid,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted" boolean NOT NULL DEFAULT false,
                "deletedBy" uuid,
                "deletedAt" TIMESTAMP WITH TIME ZONE,
                "userId" uuid NOT NULL,
                "periodType" "period_type_enum" NOT NULL,
                "periodKey" character varying(20) NOT NULL,
                "totalAmount" numeric(18,2) NOT NULL DEFAULT '0',
                "count" integer NOT NULL DEFAULT 0,
                CONSTRAINT "PK_daily_return_summary" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_summary_user_period" UNIQUE ("userId", "periodType", "periodKey"),
                CONSTRAINT "FK_daily_return_summary_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

    // Create index for efficient querying
    await queryRunner.query(`
            CREATE INDEX "IDX_summary_user_period_type" ON "daily_return_summary" ("userId", "periodType")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_summary_user_period_type"`,
    );

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "daily_return_summary"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE IF EXISTS "period_type_enum"`);
  }
}
