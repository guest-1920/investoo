import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRechargeWithdrawalSchema1777180515079 implements MigrationInterface {
  name = 'UpdateRechargeWithdrawalSchema1777180515079';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Recharge Requests Changes
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" DROP COLUMN "proof"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" ADD "blockchainAddress" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" ADD "chainName" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" ADD "transactionId" character varying NOT NULL`,
    );

    // Update default for paymentMethod if it's not already handled by schema sync generally (but explicit migration ensures safely)
    // Note: We are not removing paymentMethod, just setting a default.
    // If there are existing rows, they keep their values. New rows will get 'Blockchain' via application logic or DB default.
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" ALTER COLUMN "paymentMethod" SET DEFAULT 'Blockchain'`,
    );

    // Withdrawal Requests Changes
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" DROP COLUMN "payoutDetails"`,
    );
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" ADD "blockchainAddress" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" ADD "chainName" character varying NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" ALTER COLUMN "payoutMethod" SET DEFAULT 'Blockchain'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert Withdrawal Changes
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" ALTER COLUMN "payoutMethod" DROP DEFAULT`,
    );

    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" DROP COLUMN "chainName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" DROP COLUMN "blockchainAddress"`,
    );
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" ADD "payoutDetails" character varying NOT NULL`,
    ); // Assuming it was NOT NULL originally based on entity

    // Revert Recharge Changes
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" ALTER COLUMN "paymentMethod" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" DROP COLUMN "transactionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" DROP COLUMN "chainName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" DROP COLUMN "blockchainAddress"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" ADD "proof" character varying`,
    );
  }
}
