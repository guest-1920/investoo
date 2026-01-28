import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveIsTwoFactorEnabled1868553725375 implements MigrationInterface {
  name = 'RemoveIsTwoFactorEnabled1868553725375';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "isTwoFactorEnabled"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "isTwoFactorEnabled" boolean NOT NULL DEFAULT false`,
    );
  }
}
