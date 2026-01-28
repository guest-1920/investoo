import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApprovedByToRequests1777180515078 implements MigrationInterface {
  name = 'AddApprovedByToRequests1777180515078';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add approvedById to recharge_requests
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" ADD "approvedById" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" ADD CONSTRAINT "FK_recharge_approved_by" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Add approvedById to withdrawal_requests
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" ADD "approvedById" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "FK_withdrawal_approved_by" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" DROP CONSTRAINT "FK_withdrawal_approved_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" DROP COLUMN "approvedById"`,
    );

    await queryRunner.query(
      `ALTER TABLE "recharge_requests" DROP CONSTRAINT "FK_recharge_approved_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" DROP COLUMN "approvedById"`,
    );
  }
}
