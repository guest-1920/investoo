import { MigrationInterface, QueryRunner } from 'typeorm';

export class SystemSettingsInit1900000000000 implements MigrationInterface {
  name = 'SystemSettingsInit1900000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create System Settings Table
    await queryRunner.query(`CREATE TABLE "system_settings" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "createdBy" uuid, 
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            "updatedBy" uuid, 
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            "deleted" boolean NOT NULL DEFAULT false, 
            "deletedBy" uuid, 
            "deletedAt" TIMESTAMP WITH TIME ZONE, 
            "key" character varying NOT NULL, 
            "value" jsonb NOT NULL, 
            "description" character varying, 
            "isPublic" boolean NOT NULL DEFAULT false, 
            CONSTRAINT "UQ_system_settings_key" UNIQUE ("key"), 
            CONSTRAINT "PK_system_settings" PRIMARY KEY ("id")
        )`);

    // Drop referralReward from plans
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "referralReward"`);

    // Update WalletTransactionSource Enum
    await queryRunner.query(
      `ALTER TYPE "public"."wallet_transactions_source_enum" RENAME TO "wallet_transactions_source_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wallet_transactions_source_enum" AS ENUM('RECHARGE', 'PURCHASE', 'WITHDRAW', 'REFERRAL_BONUS', 'DAILY_RETURN', 'PRINCIPAL_RETURN')`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_transactions" ALTER COLUMN "source" TYPE "public"."wallet_transactions_source_enum" USING "source"::"text"::"public"."wallet_transactions_source_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."wallet_transactions_source_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse Enum Update
    await queryRunner.query(
      `CREATE TYPE "public"."wallet_transactions_source_enum_old" AS ENUM('RECHARGE', 'PURCHASE', 'WITHDRAW', 'REFERRAL_BONUS', 'DAILY_RETURN')`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_transactions" ALTER COLUMN "source" TYPE "public"."wallet_transactions_source_enum_old" USING "source"::"text"::"public"."wallet_transactions_source_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."wallet_transactions_source_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."wallet_transactions_source_enum_old" RENAME TO "wallet_transactions_source_enum"`,
    );

    // Add referralReward back
    await queryRunner.query(
      `ALTER TABLE "plans" ADD "referralReward" numeric NOT NULL DEFAULT '0'`,
    );

    // Drop System Settings Table
    await queryRunner.query(`DROP TABLE "system_settings"`);
  }
}
