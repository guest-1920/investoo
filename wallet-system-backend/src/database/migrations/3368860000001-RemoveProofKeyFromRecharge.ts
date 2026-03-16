import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveProofKeyFromRecharge3368860000001 implements MigrationInterface {
  name = 'RemoveProofKeyFromRecharge3368860000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" DROP COLUMN "proofKey"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" ADD "proofKey" character varying`,
    );
  }
}
