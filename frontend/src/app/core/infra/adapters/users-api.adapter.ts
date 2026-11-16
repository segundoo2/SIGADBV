import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { UserEntity } from '../../domain/entities/user.entity';
import { IUsersApiPort } from '../../application/ports/apis/users-api.port';
import { URL } from '../tokens/url.token';
import { IApiResponseModel } from '../../application/models/api-response.model';
import { IUpdatePasswordInput } from '../../application/models/update-password-input.model';

@Injectable({
  providedIn: 'root',
})
export class UsersApiAdapter implements IUsersApiPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${URL}/users`;

  async createUser(user: UserEntity): Promise<UserEntity> {
    const response: IApiResponseModel<UserEntity> = await firstValueFrom(
      this.http.post<IApiResponseModel<UserEntity>>(this.baseUrl, user, {
        withCredentials: true,
      }),
    );
    return response.data;
  }

  async getUserByUsername(
    username: string,
    tenantId: string = '0000-0000-0000-0000-000000000000',
  ): Promise<UserEntity> {
    const params = new HttpParams().set('tenantId', tenantId);

    const response = await firstValueFrom(
      this.http.get<IApiResponseModel<UserEntity>>(
        `${this.baseUrl}/${username}`,
        {
          params,
          withCredentials: true,
        },
      ),
    );
    return response.data;
  }

  async updatePassword(input: IUpdatePasswordInput): Promise<void> {
    await firstValueFrom(
      this.http.patch<IApiResponseModel<null>>(this.baseUrl, input, {
        withCredentials: true,
      }),
    );
  }
}
