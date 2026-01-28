import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProofKeyRecharge1868553725376 implements MigrationInterface {
  name = 'AddProofKeyRecharge1868553725376';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" ADD "proofKey" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" ALTER COLUMN "blockchainAddress" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" ALTER COLUMN "chainName" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" ALTER COLUMN "transactionId" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" ALTER COLUMN "transactionId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" ALTER COLUMN "chainName" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" ALTER COLUMN "blockchainAddress" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" DROP COLUMN "proofKey"`,
    );
  }
}
