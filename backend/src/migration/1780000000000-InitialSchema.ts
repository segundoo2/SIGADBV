import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1780000000000 implements MigrationInterface {
  name = 'InitialSchema1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."locations_type_enum" AS ENUM('DISPLAY', 'STORAGE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "locations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000', "code" character varying(50) NOT NULL, "type" "public"."locations_type_enum" NOT NULL DEFAULT 'STORAGE', "capacity" numeric(12,4), "description" character varying(255), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7cc1c9e3853b94816c094825e74" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bb2c7f27ed444aba2e33f76f8f" ON "locations"  ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_670dae2b80fc21cc75cfdc6cfb" ON "locations"  ("tenantId", "code") `,
    );
    await queryRunner.query(
      `CREATE TABLE "product_locations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000', "product_id" uuid NOT NULL, "location_id" uuid NOT NULL, "quantity" numeric(12,4) NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4d067f0bc961f33b2ca6b59935d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9b05d8954f930f1d818bb91ad2" ON "product_locations"  ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b460850d84111c9c0886bec93c" ON "product_locations"  ("tenantId", "product_id", "location_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000', "sku" character varying(50) NOT NULL, "name" character varying(150) NOT NULL, "uom" character varying(10) NOT NULL DEFAULT 'UN', "current_stock" numeric(12,4) NOT NULL DEFAULT '0', "minimum_stock" numeric(12,4) NOT NULL DEFAULT '0', "price" numeric(12,2) NOT NULL DEFAULT '0', "cost_price" numeric(12,2) NOT NULL DEFAULT '0', "category_id" uuid, "ean" character varying(14), "ncm" character varying(8), "cest" character varying(7), "origin" character varying(1) NOT NULL DEFAULT '0', "csosn" character varying(3), "cst" character varying(2), "created_by" character varying(100), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying(100), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6804855ba1a19523ea57e0769b" ON "products"  ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_1b6c1ded9006ffc8e024caa715" ON "products"  ("tenantId", "sku") `,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000', "name" character varying(100) NOT NULL, "description" character varying(255), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_46a85229c9953b2b94f768190b" ON "categories"  ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5a863c246e26467995e50b1b1f" ON "categories"  ("tenantId", "name") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."stock_movements_type_movement_enum" AS ENUM('IN', 'OUT', 'TRANSFER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "stock_movements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000', "type_movement" "public"."stock_movements_type_movement_enum" NOT NULL, "quantity" integer NOT NULL, "reason" character varying(255), "product_id" uuid NOT NULL, "location_id" uuid, "user_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_57a26b190618550d8e65fb860e7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7dde280faf0d06b5b1b067b8ac" ON "stock_movements"  ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7bdaaa5b411cd5dbb6c693bd6d" ON "stock_movements"  ("tenantId", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4eee41f783a5c267264fd49251" ON "stock_movements"  ("tenantId", "product_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000', "username" character varying NOT NULL, "password" character varying NOT NULL, "mustChangePassword" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c58f7e88c286e5e3478960a998" ON "users"  ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_4ac14983b3dd2b531c6537b539" ON "users"  ("tenantId", "username") `,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000', "name" character varying(50) NOT NULL, "permissions" jsonb NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "uq_role_tenant_name" UNIQUE ("tenantId", "name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c954ae3b1156e075ccd4e9ce3e" ON "roles"  ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."units_gender_enum" AS ENUM('MALE', 'FEMALE', 'MIXED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "units" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000', "name" character varying(150) NOT NULL, "gender" "public"."units_gender_enum" NOT NULL DEFAULT 'MALE', "max_members" integer NOT NULL DEFAULT '8', "score" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5a8f2f064919b587d93936cb223" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dfc3fe2db03af2e60601ca2685" ON "units"  ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_89bbd1b14df1e93165e78e9b92" ON "units"  ("tenant_id", "name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "score_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000', "unit_id" uuid NOT NULL, "score" integer NOT NULL, "description" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4db9bfe50f50c7737fc04c2fb2a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a33090dbf65d29b3169bc38095" ON "score_history"  ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_89b061d3c69cf8f876ac6c83f2" ON "score_history"  ("unit_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users_roles" ("user_id" uuid NOT NULL, "role_id" uuid NOT NULL, CONSTRAINT "PK_c525e9373d63035b9919e578a9c" PRIMARY KEY ("user_id", "role_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e4435209df12bc1f001e536017" ON "users_roles"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1cf664021f00b9cc1ff95e17de" ON "users_roles"  ("role_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "product_locations" ADD CONSTRAINT "FK_b38330f33c7ae4354b83445b23a" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_locations" ADD CONSTRAINT "FK_c87f2da66bca9b706d12f33b488" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_2c1bb05b80ddcc562cd28d826c6" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_d6ca14bc2db05193adbdbb2bcfe" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "score_history" ADD CONSTRAINT "FK_89b061d3c69cf8f876ac6c83f20" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_roles" ADD CONSTRAINT "FK_e4435209df12bc1f001e5360174" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_roles" ADD CONSTRAINT "FK_1cf664021f00b9cc1ff95e17de4" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users_roles" DROP CONSTRAINT "FK_1cf664021f00b9cc1ff95e17de4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_roles" DROP CONSTRAINT "FK_e4435209df12bc1f001e5360174"`,
    );
    await queryRunner.query(
      `ALTER TABLE "score_history" DROP CONSTRAINT "FK_89b061d3c69cf8f876ac6c83f20"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_d6ca14bc2db05193adbdbb2bcfe"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_2c1bb05b80ddcc562cd28d826c6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_locations" DROP CONSTRAINT "FK_c87f2da66bca9b706d12f33b488"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_locations" DROP CONSTRAINT "FK_b38330f33c7ae4354b83445b23a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1cf664021f00b9cc1ff95e17de"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e4435209df12bc1f001e536017"`,
    );
    await queryRunner.query(`DROP TABLE "users_roles"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_89b061d3c69cf8f876ac6c83f2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a33090dbf65d29b3169bc38095"`,
    );
    await queryRunner.query(`DROP TABLE "score_history"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_89bbd1b14df1e93165e78e9b92"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dfc3fe2db03af2e60601ca2685"`,
    );
    await queryRunner.query(`DROP TABLE "units"`);
    await queryRunner.query(`DROP TYPE "public"."units_gender_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c954ae3b1156e075ccd4e9ce3e"`,
    );
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4ac14983b3dd2b531c6537b539"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c58f7e88c286e5e3478960a998"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4eee41f783a5c267264fd49251"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7bdaaa5b411cd5dbb6c693bd6d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7dde280faf0d06b5b1b067b8ac"`,
    );
    await queryRunner.query(`DROP TABLE "stock_movements"`);
    await queryRunner.query(
      `DROP TYPE "public"."stock_movements_type_movement_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5a863c246e26467995e50b1b1f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_46a85229c9953b2b94f768190b"`,
    );
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1b6c1ded9006ffc8e024caa715"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6804855ba1a19523ea57e0769b"`,
    );
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b460850d84111c9c0886bec93c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9b05d8954f930f1d818bb91ad2"`,
    );
    await queryRunner.query(`DROP TABLE "product_locations"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_670dae2b80fc21cc75cfdc6cfb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bb2c7f27ed444aba2e33f76f8f"`,
    );
    await queryRunner.query(`DROP TABLE "locations"`);
    await queryRunner.query(`DROP TYPE "public"."locations_type_enum"`);
  }
}
