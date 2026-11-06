const { DataSource } = require('typeorm');
const {
  UnitEntity,
} = require('../dist/src/modules/units/entities/unit.entity');

const simulationTenantId = '00000000-0000-0000-0000-000000000000';
const simulationUnitName = 'Unidade de teste local';

if (process.env.NODE_ENV !== 'production' || !process.env.DATABASE_URL) {
  throw new Error(
    'Schema initialization is intended for the production-simulation container and requires DATABASE_URL.',
  );
}

async function synchronizeSimulationSchema() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: ['/app/dist/src/**/*.entity.js'],
    synchronize: true,
  });

  await dataSource.initialize();
  const units = dataSource.getRepository(UnitEntity);
  const existingUnit = await units.findOneBy({
    tenantId: simulationTenantId,
    name: simulationUnitName,
  });

  if (!existingUnit) {
    await units.save(
      units.create({
        tenantId: simulationTenantId,
        name: simulationUnitName,
        gender: 'MIXED',
      }),
    );
  }

  await dataSource.destroy();
  console.info('Production-simulation schema and sample unit are ready.');
}

synchronizeSimulationSchema().catch((error) => {
  console.error('Could not initialize the simulation database schema.', error);
  process.exitCode = 1;
});
