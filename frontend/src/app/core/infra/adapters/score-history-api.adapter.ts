import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { IScoreHistoryPayload } from "../../application/models/score-history-payload.model";
import { IScoreHistoryApiPort } from "../../application/ports/apis/score-history-api.port";
import { IScoreHistoryEntity } from "../../domain/entities/score-history.entity";
import { IApiResponseModel } from "../../application/models/api-response.model";
import { IUnitEntity } from "../../domain/entities/unit.entity";


@Injectable({
  providedIn: 'root',
})
export class ScoreHistoryApiAdapter implements IScoreHistoryApiPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${URL}/score-history`;

  async registerUnitScore(
    unitId: string,
    payload: IScoreHistoryPayload,
  ): Promise<void> {
    await firstValueFrom(
      this.http.post<IApiResponseModel<null>>(
        `${this.baseUrl}/${unitId}`,
        payload,
        { withCredentials: true },
      ),
    );
  }

  async fetchUnitScoreHistory(
    unitId: string,
    limit?: number,
  ): Promise<IScoreHistoryEntity[]> {
    let params = new HttpParams();
    if (limit !== undefined) {
      params = params.set('limit', limit.toString());
    }

    const response = await firstValueFrom(
      this.http.get<IApiResponseModel<IScoreHistoryEntity[]>>(
        `${this.baseUrl}/${unitId}`,
        { withCredentials: true, params },
      ),
    );
    return response.data;
  }

  async findAllUnitsNameAndId(): Promise<Pick<IUnitEntity, 'id' | 'name'>[]> {
    const response = await firstValueFrom(
      this.http.get<IApiResponseModel<Pick<IUnitEntity, 'id' | 'name'>[]>>(
        `${this.baseUrl}/units-options`,
        { withCredentials: true },
      ),
    );
    return response.data;
  }

  async retrivePendingUnitsScore(unitId: string): Promise<IScoreHistoryEntity[]> {
    const response = await firstValueFrom(
      this.http.get<IApiResponseModel<IScoreHistoryEntity[]>>(
        `${this.baseUrl}/pending/${unitId}`,
        { withCredentials: true },
      ),
    );
    return response.data;
  }

  async approveUnitScore(scoreHistoryId: string): Promise<void> {
    await firstValueFrom(
      this.http.patch<IApiResponseModel<null>>(
        `${this.baseUrl}/approve/${scoreHistoryId}`,
        {},
        { withCredentials: true },
      ),
    );
  }

  async rejectUnitScore(scoreHistoryId: string): Promise<void> {
    await firstValueFrom(
      this.http.patch<IApiResponseModel<null>>(
        `${this.baseUrl}/reject/${scoreHistoryId}`,
        {},
        { withCredentials: true },
      ),
    );
  }
}