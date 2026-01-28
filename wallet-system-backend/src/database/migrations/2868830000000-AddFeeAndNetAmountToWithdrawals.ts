import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFeeAndNetAmountToWithdrawals2868830000000 implements MigrationInterface {
  name = 'AddFeeAndNetAmountToWithdrawals2868830000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" ADD "fee" numeric NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" ADD "netAmount" numeric NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" DROP COLUMN "netAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" DROP COLUMN "fee"`,
    );
  }
}
