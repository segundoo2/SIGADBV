import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateScoreHistory1791429135261 implements MigrationInterface {
  name = 'UpdateScoreHistory1791429135261';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."score_history_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "score_history" ADD "status" "public"."score_history_status_enum" NOT NULL DEFAULT 'PENDING'`,
    );

    await queryRunner.query(
      `ALTER TABLE "score_history" ADD "requested_by_id" uuid`,
    );

    // 3. BACKFILL: Atribui um UUID válido de um utilizador de sistema/admin para os registos antigos que estão com NULL
    await queryRunner.query(`
            UPDATE "score_history" 
            SET "requested_by_id" = '00000000-0000-0000-0000-000000000000' 
            WHERE "requested_by_id" IS NULL
        `);
    // Nota: O UUID acima deve ser o de um utilizador real ou de sistema existente na sua tabela 'users'.

    // 4. Agora que não há mais nulos, aplicamos a restrição NOT NULL
    await queryRunner.query(
      `ALTER TABLE "score_history" ALTER COLUMN "requested_by_id" SET NOT NULL`,
    );

    // 5. Adiciona as outras colunas opcionais, índices e foreign keys normalmente
    await queryRunner.query(
      `ALTER TABLE "score_history" ADD "approved_by_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "score_history" ADD "rejected_by_id" uuid`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_df5ce0bb4d525b7dfd2b01c368" ON "score_history" ("requested_by_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a1ce4bd5b4f54007bfa9f99eca" ON "score_history" ("approved_by_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d5320f9523b59a9beafb6bde8d" ON "score_history" ("rejected_by_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "score_history" ADD CONSTRAINT "FK_df5ce0bb4d525b7dfd2b01c3686" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "score_history" ADD CONSTRAINT "FK_a1ce4bd5b4f54007bfa9f99eca7" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "score_history" ADD CONSTRAINT "FK_d5320f9523b59a9beafb6bde8d9" FOREIGN KEY ("rejected_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reversão caso precise dar rollback
    await queryRunner.query(
      `ALTER TABLE "score_history" DROP CONSTRAINT "FK_d5320f9523b59a9beafb6bde8d9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "score_history" DROP CONSTRAINT "FK_a1ce4bd5b4f54007bfa9f99eca7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "score_history" DROP CONSTRAINT "FK_df5ce0bb4d525b7dfd2b01c3686"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_d5320f9523b59a9beafb6bde8d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a1ce4bd5b4f54007bfa9f99eca"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_df5ce0bb4d525b7dfd2b01c368"`,
    );

    await queryRunner.query(
      `ALTER TABLE "score_history" DROP COLUMN "rejected_by_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "score_history" DROP COLUMN "approved_by_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "score_history" DROP COLUMN "requested_by_id"`,
    );
    await queryRunner.query(`ALTER TABLE "score_history" DROP COLUMN "status"`);

    await queryRunner.query(`DROP TYPE "public"."score_history_status_enum"`);
  }
}
