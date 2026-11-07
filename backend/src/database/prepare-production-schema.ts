import { AppDataSource } from './data-source';

const INITIAL_MIGRATION = {
  timestamp: 1780000000000,
  name: 'InitialSchema1780000000000',
};
const SCORE_HISTORY_MIGRATION = {
  timestamp: 1791578285982,
  name: 'CreateApproveColluns1791578285982',
};
const SCORE_HISTORY_MIGRATION_COLUMNS = [
  'status',
  'requested_by_id',
  'approved_by_id',
  'rejected_by_id',
];

async function ensureMigrationTable(): Promise<void> {
  const queryRunner = AppDataSource.createQueryRunner();

  try {
    if (!(await queryRunner.hasTable('migrations'))) {
      await queryRunner.query(
        `CREATE TABLE "migrations" (
          "id" SERIAL NOT NULL,
          "timestamp" bigint NOT NULL,
          "name" character varying NOT NULL,
          CONSTRAINT "PK_migrations_id" PRIMARY KEY ("id")
        )`,
      );
    }
  } finally {
    await queryRunner.release();
  }
}

async function recordMigrationIfMissing(
  timestamp: number,
  name: string,
): Promise<void> {
  await AppDataSource.query(
    `INSERT INTO "migrations" ("timestamp", "name")
     SELECT $1, $2
     WHERE NOT EXISTS (
       SELECT 1 FROM "migrations" WHERE "name" = $2
     )`,
    [timestamp, name],
  );
}

async function prepareSchema(): Promise<void> {
  await AppDataSource.initialize();

  try {
    const queryRunner = AppDataSource.createQueryRunner();
    let existingTables: string[];
    let requiredTables: string[];

    try {
      requiredTables = Array.from(
        new Set(
          AppDataSource.entityMetadatas.flatMap((metadata) => [
            metadata.tableName,
            ...metadata.relations
              .filter((relation) => relation.isManyToMany)
              .map((relation) => relation.junctionEntityMetadata.tableName),
          ]),
        ),
      );
      existingTables = [];

      for (const tableName of requiredTables) {
        if (await queryRunner.hasTable(tableName)) {
          existingTables.push(tableName);
        }
      }

      if (existingTables.length === 0) {
        if (await queryRunner.hasTable('migrations')) {
          const [migrationCount] = (await queryRunner.query(
            `SELECT COUNT(*)::int AS "count" FROM "migrations"`,
          )) as [{ count: number }];

          if (migrationCount.count > 0) {
            throw new Error(
              'O banco não contém as tabelas da aplicação, mas já possui migrations registradas. Verifique o estado do schema antes de continuar.',
            );
          }
        }

        console.info(
          'Schema vazio detectado. Aplicando migrations para criar as tabelas...',
        );
        await AppDataSource.runMigrations();
        return;
      }

      const missingTables = requiredTables.filter(
        (tableName) => !existingTables.includes(tableName),
      );
      if (missingTables.length > 0) {
        throw new Error(
          `Schema parcial detectado. Tabelas ausentes: ${missingTables.join(', ')}. Nenhuma migration foi executada para evitar alterações inconsistentes.`,
        );
      }

      for (const metadata of AppDataSource.entityMetadatas) {
        const table = await queryRunner.getTable(metadata.tableName);
        if (!table) {
          throw new Error(
            `Não foi possível verificar a tabela ${metadata.tableName}.`,
          );
        }

        const existingColumns = new Set(
          table.columns.map((column) => column.name),
        );
        const missingColumns = metadata.columns
          .map((column) => column.databaseName)
          .filter((columnName) => !existingColumns.has(columnName));
        const permittedLegacyColumns =
          metadata.tableName === 'score_history'
            ? SCORE_HISTORY_MIGRATION_COLUMNS
            : [];
        const unexpectedMissingColumns = missingColumns.filter(
          (columnName) => !permittedLegacyColumns.includes(columnName),
        );

        if (unexpectedMissingColumns.length > 0) {
          throw new Error(
            `Schema incompatível na tabela ${metadata.tableName}. Colunas ausentes: ${unexpectedMissingColumns.join(', ')}.`,
          );
        }
      }

      const scoreHistoryTable = await queryRunner.getTable('score_history');
      if (!scoreHistoryTable) {
        throw new Error('Não foi possível verificar a tabela score_history.');
      }
      const existingScoreHistoryColumns = new Set(
        scoreHistoryTable.columns.map((column) => column.name),
      );
      const scoreHistoryMigrationColumnCount =
        SCORE_HISTORY_MIGRATION_COLUMNS.filter((columnName) =>
          existingScoreHistoryColumns.has(columnName),
        ).length;

      if (
        scoreHistoryMigrationColumnCount > 0 &&
        scoreHistoryMigrationColumnCount <
          SCORE_HISTORY_MIGRATION_COLUMNS.length
      ) {
        throw new Error(
          'Schema parcial na tabela score_history: as colunas de revisão existem apenas parcialmente. Verifique o banco antes de continuar.',
        );
      }

      await ensureMigrationTable();
      await recordMigrationIfMissing(
        INITIAL_MIGRATION.timestamp,
        INITIAL_MIGRATION.name,
      );

      const [scoreHistoryMigration] = await AppDataSource.query<
        { name: string }[]
      >(`SELECT "name" FROM "migrations" WHERE "name" = $1`, [
        SCORE_HISTORY_MIGRATION.name,
      ]);

      if (scoreHistoryMigrationColumnCount === 0 && scoreHistoryMigration) {
        throw new Error(
          'O histórico de migrations indica revisão de pontuação aplicada, mas as colunas correspondentes não existem.',
        );
      }

      if (scoreHistoryMigrationColumnCount === 0) {
        const [legacyScoreHistory] = await AppDataSource.query<
          { count: number }[]
        >(`SELECT COUNT(*)::int AS "count" FROM "score_history"`);

        if (legacyScoreHistory.count > 0) {
          throw new Error(
            'Há registros antigos de pontuação sem solicitante. A migration não pode atribuí-los com segurança; defina os solicitantes desses registros antes de continuar.',
          );
        }
      }

      if (
        scoreHistoryMigrationColumnCount ===
        SCORE_HISTORY_MIGRATION_COLUMNS.length
      ) {
        await recordMigrationIfMissing(
          SCORE_HISTORY_MIGRATION.timestamp,
          SCORE_HISTORY_MIGRATION.name,
        );
      }

      console.info(
        'Schema existente verificado. Aplicando migrations pendentes...',
      );
      await AppDataSource.runMigrations();
    } finally {
      await queryRunner.release();
    }
  } finally {
    await AppDataSource.destroy();
  }
}

void prepareSchema().catch((error: unknown) => {
  console.error('Falha ao preparar o schema de produção:', error);
  process.exitCode = 1;
});
