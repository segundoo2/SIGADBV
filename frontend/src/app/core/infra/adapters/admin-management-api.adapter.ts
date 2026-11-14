import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { URL } from '../tokens/url.token';
import { CreateUserRequest } from '../../application/models/admin-management.models';
import { IAdminManagementApiPort } from '../../application/ports/apis/admin-management-api.port';
import { UserEntity } from '../../domain/entities/user.entity';
import { IApiResponseModel } from '../../application/models/api-response.model';

interface PaginatedResponse<T> extends IApiResponseModel<T[]> {
  meta: { totalPages: number };
}

@Injectable({ providedIn: 'root' })
export class AdminManagementApiAdapter implements IAdminManagementApiPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${URL}/users`;

  async listUsers(): Promise<UserEntity[]> {
    const allUsers: UserEntity[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const params = new HttpParams().set('page', page).set('limit', 100);
      const response = await firstValueFrom(
        this.http.get<PaginatedResponse<UserEntity>>(this.baseUrl, {
          params,
          withCredentials: true,
        }),
      );
      allUsers.push(...response.data);
      totalPages = response.meta.totalPages;
      page++;
    } while (page <= totalPages);

    return allUsers;
  }

  async createUser(request: CreateUserRequest): Promise<string> {
    const response = await firstValueFrom(
      this.http.post<IApiResponseModel<{ temporaryPassword: string }>>(
        this.baseUrl,
        request,
        { withCredentials: true },
      ),
    );
    return response.data.temporaryPassword;
  }

  async resetTemporaryPassword(username: string): Promise<string> {
    const response = await firstValueFrom(
      this.http.post<IApiResponseModel<{ temporaryPassword: string }>>(
        `${this.baseUrl}/${encodeURIComponent(username)}/temporary-password`,
        {},
        { withCredentials: true },
      ),
    );
    return response.data.temporaryPassword;
  }
}
