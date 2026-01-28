import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1767180515079 implements MigrationInterface {
  name = 'InitSchema1767180515079';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // CREATE ENUM TYPES
    // ============================================
    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'ADMIN')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."wallet_transactions_type_enum" AS ENUM('CREDIT', 'DEBIT')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."wallet_transactions_source_enum" AS ENUM('RECHARGE', 'PURCHASE', 'WITHDRAW', 'REFERRAL_BONUS', 'DAILY_RETURN')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."wallet_transactions_status_enum" AS ENUM('PENDING', 'SUCCESS', 'FAILED')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."recharge_requests_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."withdrawal_requests_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')
    `);

    // ============================================
    // CREATE TABLES
    // ============================================

    // 1. Users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdBy" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted" boolean NOT NULL DEFAULT false,
        "deletedBy" uuid,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER',
        "walletBalance" numeric NOT NULL DEFAULT '0',
        "referralCode" character varying NOT NULL,
        "referredBy" uuid,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_referralCode" UNIQUE ("referralCode"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // 2. Plans table
    await queryRunner.query(`
      CREATE TABLE "plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdBy" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted" boolean NOT NULL DEFAULT false,
        "deletedBy" uuid,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "name" character varying NOT NULL,
        "price" numeric NOT NULL,
        "validity" integer NOT NULL,
        "description" character varying,
        "status" character varying NOT NULL DEFAULT 'ACTIVE',
        "referralReward" numeric NOT NULL DEFAULT '0',
        "dailyReturn" numeric NOT NULL DEFAULT '0',
        CONSTRAINT "PK_plans" PRIMARY KEY ("id")
      )
    `);

    // 3. Wallet Transactions table
    await queryRunner.query(`
      CREATE TABLE "wallet_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdBy" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted" boolean NOT NULL DEFAULT false,
        "deletedBy" uuid,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "userId" uuid NOT NULL,
        "type" "public"."wallet_transactions_type_enum" NOT NULL,
        "amount" numeric NOT NULL,
        "source" "public"."wallet_transactions_source_enum" NOT NULL,
        "referenceId" uuid,
        "status" "public"."wallet_transactions_status_enum" NOT NULL DEFAULT 'PENDING',
        CONSTRAINT "PK_wallet_transactions" PRIMARY KEY ("id")
      )
    `);

    // 4. Recharge Requests table
    await queryRunner.query(`
      CREATE TABLE "recharge_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdBy" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted" boolean NOT NULL DEFAULT false,
        "deletedBy" uuid,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "userId" uuid NOT NULL,
        "amount" numeric NOT NULL,
        "paymentMethod" character varying NOT NULL,
        "proof" character varying,
        "status" "public"."recharge_requests_status_enum" NOT NULL DEFAULT 'PENDING',
        "adminRemark" character varying,
        CONSTRAINT "PK_recharge_requests" PRIMARY KEY ("id")
      )
    `);

    // 5. Withdrawal Requests table
    await queryRunner.query(`
      CREATE TABLE "withdrawal_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdBy" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted" boolean NOT NULL DEFAULT false,
        "deletedBy" uuid,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "userId" uuid NOT NULL,
        "amount" numeric NOT NULL,
        "payoutMethod" character varying NOT NULL,
        "payoutDetails" character varying NOT NULL,
        "status" "public"."withdrawal_requests_status_enum" NOT NULL DEFAULT 'PENDING',
        "adminRemark" character varying,
        CONSTRAINT "PK_withdrawal_requests" PRIMARY KEY ("id")
      )
    `);

    // 6. Subscriptions table
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdBy" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted" boolean NOT NULL DEFAULT false,
        "deletedBy" uuid,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "userId" uuid NOT NULL,
        "planId" uuid NOT NULL,
        "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id")
      )
    `);

    // 7. Daily Return Logs table
    await queryRunner.query(`
      CREATE TABLE "daily_return_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdBy" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted" boolean NOT NULL DEFAULT false,
        "deletedBy" uuid,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "subscriptionId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "planId" uuid NOT NULL,
        "amount" numeric NOT NULL,
        "creditedForDate" date NOT NULL,
        "walletTransactionId" uuid,
        CONSTRAINT "UQ_daily_return_subscription_date" UNIQUE ("subscriptionId", "creditedForDate"),
        CONSTRAINT "PK_daily_return_logs" PRIMARY KEY ("id")
      )
    `);

    // ============================================
    // CREATE INDEXES
    // ============================================

    // Users indexes
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_email" ON "users" ("email")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_referral_code" ON "users" ("referralCode")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_referred_by" ON "users" ("referredBy")`,
    );

    // Plans indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_plan_status" ON "plans" ("status")`,
    );

    // Wallet Transactions indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_wallet_tx_user" ON "wallet_transactions" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wallet_tx_source" ON "wallet_transactions" ("source")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wallet_tx_user_status" ON "wallet_transactions" ("userId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wallet_tx_user_created" ON "wallet_transactions" ("userId", "createdAt")`,
    );

    // Recharge Requests indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_recharge_user" ON "recharge_requests" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_recharge_status" ON "recharge_requests" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_recharge_user_status" ON "recharge_requests" ("userId", "status")`,
    );

    // Withdrawal Requests indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_withdrawal_user" ON "withdrawal_requests" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_withdrawal_status" ON "withdrawal_requests" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_withdrawal_user_status" ON "withdrawal_requests" ("userId", "status")`,
    );

    // Subscriptions indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_user" ON "subscriptions" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_user_active" ON "subscriptions" ("userId", "isActive")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_end_date" ON "subscriptions" ("endDate", "isActive")`,
    );

    // Daily Return Logs indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_daily_return_user" ON "daily_return_logs" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_daily_return_date" ON "daily_return_logs" ("creditedForDate")`,
    );

    // ============================================
    // CREATE FOREIGN KEY CONSTRAINTS
    // ============================================

    // Users: self-referencing FK (referredBy -> users.id)
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_user_referred_by"
      FOREIGN KEY ("referredBy") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Wallet Transactions -> Users
    await queryRunner.query(`
      ALTER TABLE "wallet_transactions"
      ADD CONSTRAINT "FK_wallet_transaction_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Recharge Requests -> Users
    await queryRunner.query(`
      ALTER TABLE "recharge_requests"
      ADD CONSTRAINT "FK_recharge_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Withdrawal Requests -> Users
    await queryRunner.query(`
      ALTER TABLE "withdrawal_requests"
      ADD CONSTRAINT "FK_withdrawal_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Subscriptions -> Users
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD CONSTRAINT "FK_subscription_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Subscriptions -> Plans
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD CONSTRAINT "FK_subscription_plan"
      FOREIGN KEY ("planId") REFERENCES "plans"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    // Daily Return Logs -> Subscriptions
    await queryRunner.query(`
      ALTER TABLE "daily_return_logs"
      ADD CONSTRAINT "FK_daily_return_subscription"
      FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Daily Return Logs -> Users
    await queryRunner.query(`
      ALTER TABLE "daily_return_logs"
      ADD CONSTRAINT "FK_daily_return_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Daily Return Logs -> Plans
    await queryRunner.query(`
      ALTER TABLE "daily_return_logs"
      ADD CONSTRAINT "FK_daily_return_plan"
      FOREIGN KEY ("planId") REFERENCES "plans"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    // Daily Return Logs -> Wallet Transactions (optional, 1:1)
    await queryRunner.query(`
      ALTER TABLE "daily_return_logs"
      ADD CONSTRAINT "FK_daily_return_wallet_tx"
      FOREIGN KEY ("walletTransactionId") REFERENCES "wallet_transactions"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // DROP FOREIGN KEY CONSTRAINTS
    // ============================================
    await queryRunner.query(
      `ALTER TABLE "daily_return_logs" DROP CONSTRAINT "FK_daily_return_wallet_tx"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_return_logs" DROP CONSTRAINT "FK_daily_return_plan"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_return_logs" DROP CONSTRAINT "FK_daily_return_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_return_logs" DROP CONSTRAINT "FK_daily_return_subscription"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscription_plan"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscription_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "withdrawal_requests" DROP CONSTRAINT "FK_withdrawal_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recharge_requests" DROP CONSTRAINT "FK_recharge_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_wallet_transaction_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_user_referred_by"`,
    );

    // ============================================
    // DROP INDEXES
    // ============================================
    await queryRunner.query(`DROP INDEX "public"."IDX_daily_return_date"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_daily_return_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_subscription_end_date"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_subscription_user_active"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_subscription_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_withdrawal_user_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_withdrawal_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_withdrawal_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_recharge_user_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_recharge_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_recharge_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_wallet_tx_user_created"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_wallet_tx_user_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_wallet_tx_source"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_wallet_tx_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_plan_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_referred_by"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_referral_code"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_email"`);

    // ============================================
    // DROP TABLES
    // ============================================
    await queryRunner.query(`DROP TABLE "daily_return_logs"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TABLE "withdrawal_requests"`);
    await queryRunner.query(`DROP TABLE "recharge_requests"`);
    await queryRunner.query(`DROP TABLE "wallet_transactions"`);
    await queryRunner.query(`DROP TABLE "plans"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // ============================================
    // DROP ENUM TYPES
    // ============================================
    await queryRunner.query(
      `DROP TYPE "public"."withdrawal_requests_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."recharge_requests_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."wallet_transactions_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."wallet_transactions_source_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."wallet_transactions_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
