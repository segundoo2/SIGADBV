import { IScoreHistoryEntity } from '../../entities/score-history.entity';
import { IResponseModel } from '../../models/response.model';
import { IScoreHistoryPayload } from '../../models/score-history-payload.model';

export interface IScoreHistoryApiPort {
  registerScore(unitId: string, payload: IScoreHistoryPayload): Promise<IResponseModel<{ newScore: number }>>;
  getHistoryByUnitId(
    unitId: string,
  ): Promise<IResponseModel<IScoreHistoryEntity[] >>;
}
