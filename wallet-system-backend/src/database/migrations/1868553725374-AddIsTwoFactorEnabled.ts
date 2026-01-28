import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsTwoFactorEnabled1868553725374 implements MigrationInterface {
  name = 'AddIsTwoFactorEnabled1868553725374';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_wallet_transaction_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" DROP CONSTRAINT "FK_recharge_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" DROP CONSTRAINT "FK_recharge_approved_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscription_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscription_plan"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_user_referred_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" DROP CONSTRAINT "FK_withdrawal_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" DROP CONSTRAINT "FK_withdrawal_approved_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_return_logs" DROP CONSTRAINT "FK_daily_return_subscription"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_return_logs" DROP CONSTRAINT "FK_daily_return_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_return_logs" DROP CONSTRAINT "FK_daily_return_plan"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_return_logs" DROP CONSTRAINT "FK_daily_return_wallet_tx"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "isTwoFactorEnabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "plans"."dailyReturn" IS 'Amount credited daily to subscriber wallet'`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" character varying NOT NULL DEFAULT 'USER'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_69454773f1e666a14c6a9539353" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" ADD CONSTRAINT "FK_834d725e83ade4f65b28d6b56c1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_fbdba4e2ac694cf8c9cecf4dc84" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_7536cba909dd7584a4640cad7d5" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_d3998945517e0cac384f573b3cb" FOREIGN KEY ("referredBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "FK_bc861755994227c5b2582edd782" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_return_logs" ADD CONSTRAINT "FK_aeb27e8d77c91f764ffa5ef9ee9" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_return_logs" ADD CONSTRAINT "FK_1f6297112a2ab4d896125c96faa" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_return_logs" ADD CONSTRAINT "FK_1844ff60f59d72d3cd515979a7a" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_return_logs" ADD CONSTRAINT "FK_09e1e73b6ea6568ab450daf020d" FOREIGN KEY ("walletTransactionId") REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "daily_return_logs" DROP CONSTRAINT "FK_09e1e73b6ea6568ab450daf020d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_return_logs" DROP CONSTRAINT "FK_1844ff60f59d72d3cd515979a7a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_return_logs" DROP CONSTRAINT "FK_1f6297112a2ab4d896125c96faa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_return_logs" DROP CONSTRAINT "FK_aeb27e8d77c91f764ffa5ef9ee9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" DROP CONSTRAINT "FK_bc861755994227c5b2582edd782"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_d3998945517e0cac384f573b3cb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_7536cba909dd7584a4640cad7d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_fbdba4e2ac694cf8c9cecf4dc84"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" DROP CONSTRAINT "FK_834d725e83ade4f65b28d6b56c1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_69454773f1e666a14c6a9539353"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'ADMIN')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER'`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "plans"."dailyReturn" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "isTwoFactorEnabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_return_logs" ADD CONSTRAINT "FK_daily_return_wallet_tx" FOREIGN KEY ("walletTransactionId") REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_return_logs" ADD CONSTRAINT "FK_daily_return_plan" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_return_logs" ADD CONSTRAINT "FK_daily_return_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_return_logs" ADD CONSTRAINT "FK_daily_return_subscription" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "FK_withdrawal_approved_by" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "FK_withdrawal_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_user_referred_by" FOREIGN KEY ("referredBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscription_plan" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscription_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" ADD CONSTRAINT "FK_recharge_approved_by" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" ADD CONSTRAINT "FK_recharge_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_wallet_transaction_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
