import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRewardToWalletSource3368860000000 implements MigrationInterface {
    name = 'AddRewardToWalletSource3368860000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add 'REWARD' to wallet_transactions_source_enum
        await queryRunner.query(`ALTER TYPE "public"."wallet_transactions_source_enum" ADD VALUE IF NOT EXISTS 'REWARD'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Removing enum values is not directly supported in Postgres
        // Would require recreating the entire enum type
        // Keeping the value is harmless
    }
}
