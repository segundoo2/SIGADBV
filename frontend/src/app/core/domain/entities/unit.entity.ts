import { EUnitGender } from '../enums/unit-gender.enum';
import { IScoreHistoryEntity } from './score-history.entity';

export interface IUnitEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly gender: EUnitGender;
  readonly maxMembers: number;
  readonly score: number;
  readonly scoreHistories?: readonly IScoreHistoryEntity[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
