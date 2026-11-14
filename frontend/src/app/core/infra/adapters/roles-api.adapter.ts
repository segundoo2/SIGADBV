import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { URL } from '../tokens/url.token';
import { CreateRoleRequest } from '../../application/models/admin-management.models';
import { IRolesApiPort } from '../../application/ports/apis/roles-api.port';
import { RoleEntity } from '../../domain/entities/role.entity';
import { IApiResponseModel } from '../../application/models/api-response.model';

interface PaginatedResponse<T> extends IApiResponseModel<T[]> {
  meta: { totalPages: number };
}

@Injectable({ providedIn: 'root' })
export class RolesApiAdapter implements IRolesApiPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${URL}/roles`;

  async listRoles(): Promise<RoleEntity[]> {
    const allRoles: RoleEntity[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const params = new HttpParams().set('page', page).set('limit', 100);
      const response = await firstValueFrom(
        this.http.get<PaginatedResponse<RoleEntity>>(this.baseUrl, {
          params,
          withCredentials: true,
        }),
      );
      allRoles.push(...response.data);
      totalPages = response.meta.totalPages;
      page++;
    } while (page <= totalPages);

    return allRoles;
  }

  async listPermissions(): Promise<string[]> {
    const response = await firstValueFrom(
      this.http.get<IApiResponseModel<{ permissions: string[] }>>(
        `${URL}/permissions`,
        { withCredentials: true },
      ),
    );
    return response.data.permissions;
  }

  async createRole(request: CreateRoleRequest): Promise<void> {
    await firstValueFrom(
      this.http.post<IApiResponseModel<RoleEntity>>(this.baseUrl, request, {
        withCredentials: true,
      }),
    );
  }
}
