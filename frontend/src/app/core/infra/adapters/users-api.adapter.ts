import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { UserEntity } from '../../domain/entities/user.entity';
import { IResponseModel } from '../../domain/models/response.model';
import { IUsersApiPort } from '../../domain/ports/apis/users-api.port';
import { URL } from '../tokens/url.token';

@Injectable({
  providedIn: 'root',
})
export class UsersApiAdapter implements IUsersApiPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${URL}/users`;

  async findOneByUsername(
    username: string,
    tenantId: string = '0000-0000-0000-0000-000000000000',
  ): Promise<IResponseModel<Omit<UserEntity, 'password'>>> {
    const params = new HttpParams().set('tenantId', tenantId);

    return await firstValueFrom(
      this.http.get<IResponseModel<Omit<UserEntity, 'password'>>>(
        `${this.baseUrl}/${username}`,
        {
          params,
          withCredentials: true,
        },
      ),
    );
  }
}