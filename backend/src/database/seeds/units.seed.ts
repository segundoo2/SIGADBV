import { DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EUnitGender } from '../../common/enum/unit/unit-gender.enum';
import { CreateUnitDto } from '../../modules/units/dto/create-unit.dto';
import { UnitEntity } from '../../modules/units/entities/unit.entity';

export async function seedUnits(dataSource: DataSource): Promise<void> {
  const unitRepository = dataSource.getRepository(UnitEntity);

  const unitsData: CreateUnitDto[] = [
    // --- Clube Reino Selvagem (RS) ---
    // Femininas
    { name: 'Pantera (RS)', gender: EUnitGender.FEMALE },
    { name: 'Lince (RS)', gender: EUnitGender.FEMALE },
    // Masculinas
    { name: 'Gavião Real (RS)', gender: EUnitGender.MALE },
    { name: 'Jacaré (RS)', gender: EUnitGender.MALE },

    // --- Clube Amigos da Natureza (CDAN) ---
    // Femininas
    { name: 'Panda (CDAN)', gender: EUnitGender.FEMALE, maxMembers: 10 },
    { name: 'Pantera (CDAN)', gender: EUnitGender.FEMALE, maxMembers: 9 },
    // Masculinas
    { name: 'Leopardo (CDAN)', gender: EUnitGender.MALE },
    { name: 'Águia (CDAN)', gender: EUnitGender.MALE, maxMembers: 10 },
  ];

  for (const unitRawData of unitsData) {
    // Transforma o objeto bruto em uma instância do DTO
    const unitDto = plainToInstance(CreateUnitDto, unitRawData);

    // Executa as validações do class-validator
    const errors = await validate(unitDto);
    if (errors.length > 0) {
      console.error(
        `Erro de validação na unidade "${unitRawData.name}":`,
        errors,
      );
      continue;
    }

    const existingUnit = await unitRepository.findOne({
      where: {
        name: unitDto.name,
      },
    });

    if (existingUnit) {
      console.log(`Unidade já existe: ${unitDto.name}`);
    }

    const unit = unitRepository.create({
      name: unitDto.name,
      gender: unitDto.gender,
      ...(unitDto.maxMembers !== undefined && {
        maxMembers: unitDto.maxMembers,
      }),
    });

    await unitRepository.save(unit);
    console.log(`Unidade criada: ${unit.name} (${unit.gender})`);
  }
}
