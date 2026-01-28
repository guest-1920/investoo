import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixDailyReturnSummarySchema3268830000000 implements MigrationInterface {
    name = 'FixDailyReturnSummarySchema3268830000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Check if the column already exists to be safe
        const table = await queryRunner.getTable('daily_return_summary');
        const columnExists = table?.columns.find((c) => c.name === 'periodType');

        if (!columnExists) {
            // 2. Ensure the enum type exists
            // We use IF NOT EXISTS workaround or just catch error if it exists
            // But better to just try creating it and ignore duplicate error if postgres
            try {
                await queryRunner.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'period_type_enum') THEN
                        CREATE TYPE "period_type_enum" AS ENUM ('day', 'week', 'month');
                    END IF;
                END$$;
            `);
            } catch (e) {
                // Ignore if it fails, assuming it might exist
            }

            // 3. Add the column. We add it as nullable first to avoid issues with existing data,
            // or give it a default value. Given the business logic, 'day' seems a safe default for existing rows (if any).
            await queryRunner.query(`
            ALTER TABLE "daily_return_summary" 
            ADD COLUMN "periodType" "period_type_enum" NOT NULL DEFAULT 'day'
        `);

            // 4. Drop old index if it exists (it might be broken or missing the column)
            await queryRunner.query(`DROP INDEX IF EXISTS "IDX_summary_user_period_type"`);

            // 5. Create the proper index
            await queryRunner.query(`
            CREATE INDEX "IDX_summary_user_period_type" ON "daily_return_summary" ("userId", "periodType")
        `);

            // 6. Fix Unique Constraint for (userId, periodType, periodKey)
            // First drop the old one if it exists (it might be missing periodType effectively acting as userId+periodKey?)
            // The previous migration called it "UQ_summary_user_period".

            try {
                await queryRunner.query(`ALTER TABLE "daily_return_summary" DROP CONSTRAINT IF EXISTS "UQ_summary_user_period"`);
            } catch (e) { }

            await queryRunner.query(`
            ALTER TABLE "daily_return_summary" 
            ADD CONSTRAINT "UQ_summary_user_period" UNIQUE ("userId", "periodType", "periodKey")
         `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('daily_return_summary');
        const columnExists = table?.columns.find((c) => c.name === 'periodType');

        if (columnExists) {
            // Drop constraint that depends on the column
            await queryRunner.query(`ALTER TABLE "daily_return_summary" DROP CONSTRAINT IF EXISTS "UQ_summary_user_period"`);

            // Drop index
            await queryRunner.query(`DROP INDEX IF EXISTS "IDX_summary_user_period_type"`);

            // Drop column
            await queryRunner.query(`ALTER TABLE "daily_return_summary" DROP COLUMN "periodType"`);
        }
    }
}
