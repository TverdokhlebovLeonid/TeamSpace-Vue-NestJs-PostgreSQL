import {MigrationInterface, QueryRunner} from 'typeorm'

export class InitSchema1700000000000 implements MigrationInterface {
  name = 'InitSchema1700000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'USER')`)
    await queryRunner.query(`CREATE TYPE "public"."users_language_enum" AS ENUM('en', 'ru')`)
    await queryRunner.query(
      `CREATE TYPE "public"."conversations_type_enum" AS ENUM('direct', 'group')`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."conversation_members_role_enum" AS ENUM('owner', 'member')`
    )

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" character varying(150) NOT NULL,
        "email" character varying(254) NOT NULL DEFAULT '',
        "first_name" character varying(150) NOT NULL DEFAULT '',
        "last_name" character varying(150) NOT NULL DEFAULT '',
        "password_hash" character varying(255) NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER',
        "language" "public"."users_language_enum" NOT NULL DEFAULT 'en',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_username" ON "users" ("username")`)

    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "public"."conversations_type_enum" NOT NULL,
        "title" character varying(150),
        "created_by" uuid NOT NULL,
        "direct_key" character varying(73),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversations_id" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_conversations_direct_key" ON "conversations" ("direct_key") WHERE "direct_key" IS NOT NULL`
    )

    await queryRunner.query(`
      CREATE TABLE "conversation_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "conversation_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" "public"."conversation_members_role_enum" NOT NULL DEFAULT 'member',
        "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversation_members_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_member_conversation_user" UNIQUE ("conversation_id", "user_id"),
        CONSTRAINT "FK_member_conversation" FOREIGN KEY ("conversation_id")
          REFERENCES "conversations" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_member_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `)
    await queryRunner.query(
      `CREATE INDEX "IDX_member_conversation" ON "conversation_members" ("conversation_id")`
    )
    await queryRunner.query(`CREATE INDEX "IDX_member_user" ON "conversation_members" ("user_id")`)

    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "conversation_id" uuid NOT NULL,
        "sender_id" uuid NOT NULL,
        "content" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_message_conversation" FOREIGN KEY ("conversation_id")
          REFERENCES "conversations" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_message_sender" FOREIGN KEY ("sender_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `)
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_conversation_created" ON "messages" ("conversation_id", "created_at")`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_messages_conversation_created"`)
    await queryRunner.query(`DROP TABLE "messages"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_member_user"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_member_conversation"`)
    await queryRunner.query(`DROP TABLE "conversation_members"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_conversations_direct_key"`)
    await queryRunner.query(`DROP TABLE "conversations"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_users_username"`)
    await queryRunner.query(`DROP TABLE "users"`)
    await queryRunner.query(`DROP TYPE "public"."conversation_members_role_enum"`)
    await queryRunner.query(`DROP TYPE "public"."conversations_type_enum"`)
    await queryRunner.query(`DROP TYPE "public"."users_language_enum"`)
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`)
  }
}
