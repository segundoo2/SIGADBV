import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IScoreHistoryApiPort } from '../../domain/ports/apis/score-history-api.port';
import { URL } from '../tokens/url.token';
import { IResponseModel } from '../../domain/models/response.model';
import { IScoreHistoryEntity } from '../../domain/entities/score-history.entity';
import { IScoreHistoryPayload } from '../../domain/models/score-history-payload.model';

@Injectable({
  providedIn: 'root',
})
export class ScoreHistoryApiAdapter implements IScoreHistoryApiPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${URL}/score-history`;

  async registerScore(
    unitId: string,
    payload: IScoreHistoryPayload,
  ): Promise<IResponseModel<{ newScore: number }>> {
    return await firstValueFrom(
      this.http.post<IResponseModel<{ newScore: number }>>(
        `${this.baseUrl}/${unitId}`,
        payload,
        { withCredentials: true },
      ),
    );
  }

  async getHistoryByUnitId(
    unitId: string,
    limit?: number,
  ): Promise<IResponseModel<IScoreHistoryEntity[]>> {
    let params = new HttpParams();
    if (limit !== undefined) {
      params = params.set('limit', limit.toString());
    }

    return await firstValueFrom(
      this.http.get<IResponseModel<IScoreHistoryEntity[]>>(
        `${this.baseUrl}/${unitId}`,
        { withCredentials: true, params },
      ),
    );
  }
}