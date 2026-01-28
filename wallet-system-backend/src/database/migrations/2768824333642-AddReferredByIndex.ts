import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReferredByIndex2768824333642 implements MigrationInterface {
  name = 'AddReferredByIndex2768824333642';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_users_referredBy" ON "users" ("referredBy")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_referredBy"`);
  }
}
