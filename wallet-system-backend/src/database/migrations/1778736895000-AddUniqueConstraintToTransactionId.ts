import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueConstraintToTransactionId1778736895000 implements MigrationInterface {
  name = 'AddUniqueConstraintToTransactionId1778736895000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" ADD CONSTRAINT "UQ_recharge_transactionId" UNIQUE ("transactionId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" DROP CONSTRAINT "UQ_recharge_transactionId"`,
    );
  }
}
