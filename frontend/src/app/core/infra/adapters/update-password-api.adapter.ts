import { HttpClient } from '@angular/common/http';
import { IResponseModel } from '../../domain/models/response.model';
import { IUpdatePasswordDto } from '../../domain/models/update-password-dto.model';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { URL } from '../tokens/url.token';
import { IUpdatePasswordApiPort } from '../../domain/ports/apis/update-password-api.port';

@Injectable({
  providedIn: 'root',
})
export class UpdatePasswordApiAdapter implements IUpdatePasswordApiPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${URL}/users`;

  updatePassword(
    updatePassword: IUpdatePasswordDto,
  ): Promise<IResponseModel<null>> {
    return firstValueFrom(
      this.http.patch<IResponseModel<null>>(this.baseUrl, updatePassword, {
        withCredentials: true,
      }),
    );
  }
}
