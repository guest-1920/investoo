import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSupportTicketsTables3068830000000 implements MigrationInterface {
  name = 'CreateSupportTicketsTables3068830000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the ticket_department enum
    await queryRunner.query(`
            CREATE TYPE "ticket_department_enum" AS ENUM ('GENERAL', 'BILLING', 'TECHNICAL')
        `);

    // Create the ticket_priority enum
    await queryRunner.query(`
            CREATE TYPE "ticket_priority_enum" AS ENUM ('NORMAL', 'HIGH', 'URGENT')
        `);

    // Create the ticket_status enum
    await queryRunner.query(`
            CREATE TYPE "ticket_status_enum" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')
        `);

    // Create the support_tickets table
    await queryRunner.query(`
            CREATE TABLE "support_tickets" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "createdBy" uuid,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedBy" uuid,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted" boolean NOT NULL DEFAULT false,
                "deletedBy" uuid,
                "deletedAt" TIMESTAMP WITH TIME ZONE,
                "ticketNumber" character varying NOT NULL,
                "userId" uuid NOT NULL,
                "subject" character varying NOT NULL,
                "department" "ticket_department_enum" NOT NULL DEFAULT 'GENERAL',
                "priority" "ticket_priority_enum" NOT NULL DEFAULT 'NORMAL',
                "status" "ticket_status_enum" NOT NULL DEFAULT 'OPEN',
                CONSTRAINT "UQ_support_ticket_number" UNIQUE ("ticketNumber"),
                CONSTRAINT "PK_support_tickets" PRIMARY KEY ("id"),
                CONSTRAINT "FK_support_tickets_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

    // Create indexes for support_tickets
    await queryRunner.query(`
            CREATE INDEX "IDX_support_ticket_user" ON "support_tickets" ("userId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_support_ticket_status" ON "support_tickets" ("status")
        `);

    // Create the ticket_replies table
    await queryRunner.query(`
            CREATE TABLE "ticket_replies" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "createdBy" uuid,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedBy" uuid,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted" boolean NOT NULL DEFAULT false,
                "deletedBy" uuid,
                "deletedAt" TIMESTAMP WITH TIME ZONE,
                "ticketId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "message" text NOT NULL,
                "isAdminReply" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_ticket_replies" PRIMARY KEY ("id"),
                CONSTRAINT "FK_ticket_replies_ticket" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_ticket_replies_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

    // Create index for ticket_replies
    await queryRunner.query(`
            CREATE INDEX "IDX_ticket_reply_ticket" ON "ticket_replies" ("ticketId")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ticket_reply_ticket"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_support_ticket_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_support_ticket_user"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "ticket_replies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "support_tickets"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "ticket_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ticket_priority_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ticket_department_enum"`);
  }
}
