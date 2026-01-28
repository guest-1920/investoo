import { MigrationInterface, QueryRunner } from "typeorm";

export class FixReferralSchema3368830000000 implements MigrationInterface {
    name = 'FixReferralSchema3368830000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add 'PENDING_SELECTION' to enum
        // Name found in 3168830000000-CreateReferralSystem.ts line 15: "fulfillment_status_enum"
        await queryRunner.query(`ALTER TYPE "public"."fulfillment_status_enum" ADD VALUE IF NOT EXISTS 'PENDING_SELECTION'`);

        // 2. Drop unique constraint
        // Correct name found in error log: "UQ_progress_user_window"
        await queryRunner.query(`ALTER TABLE "referral_window_progress" DROP CONSTRAINT IF EXISTS "UQ_progress_user_window"`);

        // Also dropping the index if it exists separately
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_progress_user_window"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Re-adding constraint is risky if duplicates exist now, but for down migration:
        await queryRunner.query(`ALTER TABLE "referral_window_progress" ADD CONSTRAINT "UQ_progress_user_window" UNIQUE ("userId", "windowId")`);

        // Removing enum value is not directly supported in Postgres easily without recreating type
        // keeping it is usually harmless
    }
}
