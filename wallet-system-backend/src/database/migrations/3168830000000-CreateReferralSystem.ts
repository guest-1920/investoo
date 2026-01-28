import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReferralSystem3168830000000 implements MigrationInterface {
    name = 'CreateReferralSystem3168830000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ENUMS
        await queryRunner.query(
            `CREATE TYPE "referral_window_progress_status_enum" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'CLAIMED')`,
        );
        await queryRunner.query(
            `CREATE TYPE "reward_type_enum" AS ENUM ('DIGITAL', 'PHYSICAL')`,
        );
        await queryRunner.query(
            `CREATE TYPE "fulfillment_status_enum" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'FAILED')`,
        );

        // Rewards (Create First so it can be referenced)
        await queryRunner.query(`CREATE TABLE "rewards" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "deletedAt" TIMESTAMP WITH TIME ZONE,
            "createdBy" uuid,
            "updatedBy" uuid,
            "deletedBy" uuid,
            "deleted" boolean NOT NULL DEFAULT false,
            "name" character varying NOT NULL,
            "description" text,
            "type" "reward_type_enum" NOT NULL,
            "value" numeric NOT NULL,
            "imageUrl" character varying,
            "isActive" boolean NOT NULL DEFAULT true,
            "stock" integer,
            "metadata" jsonb,
            CONSTRAINT "PK_rewards" PRIMARY KEY ("id")
        )`);

        // Referral Windows
        await queryRunner.query(`CREATE TABLE "referral_windows" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "deletedAt" TIMESTAMP WITH TIME ZONE,
            "createdBy" uuid,
            "updatedBy" uuid,
            "deletedBy" uuid,
            "deleted" boolean NOT NULL DEFAULT false,
            "name" character varying NOT NULL,
            "targetReferralCount" integer NOT NULL,
            "windowDurationDays" integer NOT NULL,
            "minPurchaseAmount" integer NOT NULL DEFAULT 0,
            "isActive" boolean NOT NULL DEFAULT true,
            "validFrom" date,
            "validUntil" date,
            "rewardId" uuid,
            CONSTRAINT "PK_referral_windows" PRIMARY KEY ("id")
        )`);

        // Link Window -> Reward
        await queryRunner.query(
            `ALTER TABLE "referral_windows" ADD CONSTRAINT "FK_windows_reward" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );

        // Update Plans Table (Add Link to Reward)
        await queryRunner.query(
            `ALTER TABLE "plans" ADD "rewardId" uuid`,
        );
        await queryRunner.query(
            `ALTER TABLE "plans" ADD CONSTRAINT "FK_plans_reward" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );

        // Referral Window Progress
        await queryRunner.query(`CREATE TABLE "referral_window_progress" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "deletedAt" TIMESTAMP WITH TIME ZONE,
            "createdBy" uuid,
            "updatedBy" uuid,
            "deletedBy" uuid,
            "deleted" boolean NOT NULL DEFAULT false,
            "userId" uuid NOT NULL,
            "windowId" uuid NOT NULL,
            "windowStart" TIMESTAMP WITH TIME ZONE NOT NULL,
            "windowEnd" TIMESTAMP WITH TIME ZONE NOT NULL,
            "qualifiedReferrals" integer NOT NULL DEFAULT 0,
            "status" "referral_window_progress_status_enum" NOT NULL DEFAULT 'IN_PROGRESS',
            "completedAt" TIMESTAMP WITH TIME ZONE,
            "claimedAt" TIMESTAMP WITH TIME ZONE,
            CONSTRAINT "UQ_progress_user_window" UNIQUE ("userId", "windowId"),
            CONSTRAINT "PK_referral_window_progress" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(
            `ALTER TABLE "referral_window_progress" ADD CONSTRAINT "FK_progress_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "referral_window_progress" ADD CONSTRAINT "FK_progress_window" FOREIGN KEY ("windowId") REFERENCES "referral_windows"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );

        // Customer Addresses
        await queryRunner.query(`CREATE TABLE "customer_addresses" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "deletedAt" TIMESTAMP WITH TIME ZONE,
            "createdBy" uuid,
            "updatedBy" uuid,
            "deletedBy" uuid,
            "deleted" boolean NOT NULL DEFAULT false,
            "userId" uuid NOT NULL,
            "label" character varying NOT NULL DEFAULT 'Home',
            "fullName" character varying NOT NULL,
            "phone" character varying NOT NULL,
            "addressLine1" character varying NOT NULL,
            "addressLine2" character varying,
            "city" character varying NOT NULL,
            "state" character varying NOT NULL,
            "postalCode" character varying NOT NULL,
            "country" character varying NOT NULL DEFAULT 'India',
            "isDefault" boolean NOT NULL DEFAULT false,
            CONSTRAINT "PK_customer_addresses" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(
            `CREATE INDEX "IDX_address_user" ON "customer_addresses" ("userId") `,
        );
        await queryRunner.query(
            `ALTER TABLE "customer_addresses" ADD CONSTRAINT "FK_customer_addresses_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );

        // Reward Fulfillments
        await queryRunner.query(`CREATE TABLE "reward_fulfillments" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "deletedAt" TIMESTAMP WITH TIME ZONE,
            "createdBy" uuid,
            "updatedBy" uuid,
            "deletedBy" uuid,
            "deleted" boolean NOT NULL DEFAULT false,
            "userId" uuid NOT NULL,
            "rewardId" uuid NOT NULL,
            "addressId" uuid,
            "sourcePlanId" uuid,
            "sourceWindowProgressId" uuid,
            "status" "fulfillment_status_enum" NOT NULL DEFAULT 'PENDING',
            "trackingNumber" character varying,
            "adminNotes" text,
            "scheduledAt" TIMESTAMP WITH TIME ZONE,
            "shippedAt" TIMESTAMP WITH TIME ZONE,
            "deliveredAt" TIMESTAMP WITH TIME ZONE,
            CONSTRAINT "PK_reward_fulfillments" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(
            `CREATE INDEX "IDX_fulfillment_user" ON "reward_fulfillments" ("userId") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_fulfillment_status" ON "reward_fulfillments" ("status") `,
        );
        await queryRunner.query(
            `ALTER TABLE "reward_fulfillments" ADD CONSTRAINT "FK_fulfillment_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "reward_fulfillments" ADD CONSTRAINT "FK_fulfillment_reward" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "reward_fulfillments" ADD CONSTRAINT "FK_fulfillment_address" FOREIGN KEY ("addressId") REFERENCES "customer_addresses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop Tables (Reverse Order)
        await queryRunner.query(
            `ALTER TABLE "reward_fulfillments" DROP CONSTRAINT "FK_fulfillment_address"`,
        );
        await queryRunner.query(
            `ALTER TABLE "reward_fulfillments" DROP CONSTRAINT "FK_fulfillment_reward"`,
        );
        await queryRunner.query(
            `ALTER TABLE "reward_fulfillments" DROP CONSTRAINT "FK_fulfillment_user"`,
        );
        await queryRunner.query(`DROP INDEX "IDX_fulfillment_status"`);
        await queryRunner.query(`DROP INDEX "IDX_fulfillment_user"`);
        await queryRunner.query(`DROP TABLE "reward_fulfillments"`);

        await queryRunner.query(
            `ALTER TABLE "customer_addresses" DROP CONSTRAINT "FK_customer_addresses_user"`,
        );
        await queryRunner.query(`DROP INDEX "IDX_address_user"`);
        await queryRunner.query(`DROP TABLE "customer_addresses"`);

        await queryRunner.query(
            `ALTER TABLE "referral_window_progress" DROP CONSTRAINT "FK_progress_window"`,
        );
        await queryRunner.query(
            `ALTER TABLE "referral_window_progress" DROP CONSTRAINT "FK_progress_user"`,
        );
        await queryRunner.query(`DROP TABLE "referral_window_progress"`);

        // Revert Plans Changes
        await queryRunner.query(
            `ALTER TABLE "plans" DROP CONSTRAINT "FK_plans_reward"`,
        );
        await queryRunner.query(
            `ALTER TABLE "plans" DROP COLUMN "rewardId"`,
        );

        // Revert Referral Windows
        await queryRunner.query(
            `ALTER TABLE "referral_windows" DROP CONSTRAINT "FK_windows_reward"`,
        );
        await queryRunner.query(`DROP TABLE "referral_windows"`);

        // Revert Rewards
        await queryRunner.query(`DROP TABLE "rewards"`);

        // Drop Enums
        await queryRunner.query(`DROP TYPE "fulfillment_status_enum"`);
        await queryRunner.query(`DROP TYPE "reward_type_enum"`);
        await queryRunner.query(`DROP TYPE "referral_window_progress_status_enum"`);
    }
}
