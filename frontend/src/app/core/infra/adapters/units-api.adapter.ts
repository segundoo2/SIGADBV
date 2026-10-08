import { Injectable, inject } from '@angular/core';
import { IUnitEntity } from '../../domain/entities/unit.entity';
import { IUnitsApiPort } from '../../application/ports/apis/units-api.port';
import { ApiResponseDto } from '../../application/models/api-response.model';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { URL } from '../tokens/url.token';

@Injectable({ providedIn: 'root' })
export class UnitsApiAdapter implements IUnitsApiPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${URL}/units`;

  async fetchAllUnits(): Promise<IUnitEntity[]> {
    const response = await firstValueFrom(
      this.http.get<ApiResponseDto<IUnitEntity[]>>(this.baseUrl, {
        withCredentials: true,
      }),
    );
    return response.data;
  }
}
