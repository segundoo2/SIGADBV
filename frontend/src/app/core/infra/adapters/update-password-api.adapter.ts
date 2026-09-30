import { HttpClient } from '@angular/common/http';
import { IResponseModel } from '../../domain/models/response.model';
import { IUpdatePasswordDto } from '../../domain/models/update-password-dto.model';
import { IUpdatePasswordApiPort } from '../../domain/ports/update-password-api.port';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { URL } from '../tokens/url.token';

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
