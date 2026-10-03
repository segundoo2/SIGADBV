import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UsersApiAdapter } from '../users-api.adapter';
import { apiErrorInterceptor } from '../../interceptors/api-error.interceptor';
import { UserEntity } from '../../../domain/entities/user.entity';
import { IResponseModel } from '../../../domain/models/response.model';
import { URL } from '../../tokens/url.token';

describe('UsersApiAdapter', () => {
  let adapter: UsersApiAdapter;
  let httpMock: HttpTestingController;
  const baseUrl = `${URL}/users`; // Ajuste se a const URL for diferente

  beforeEach(() => {
    // 1. Limpa o TestBed antes de reconfigurar
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        UsersApiAdapter,
      ],
    });

    // 2. Injeta apenas DEPOIS de configurar o módulo
    adapter = TestBed.inject(UsersApiAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch and return a user by username and tenantId', async () => {
    const username = 'edilson.segundo';
    const tenantId = '00000000-0000-0000-0000-000000000000';

    const user: Omit<UserEntity, 'password'> = {
      id: 'da90c852-83de-448b-b794-cefc52925760',
      tenantId,
      username,
      mustChangePassword: false,
      roles: [],
      createdAt: new Date('2026-09-01T10:00:00.000Z'),
      updatedAt: new Date('2026-09-02T10:00:00.000Z'),
    };

    const response: IResponseModel<Omit<UserEntity, 'password'>> = {
      message: 'User found',
      data: user,
    };

    const promise = adapter.findOneByUsername(username, tenantId);
    
    const request = httpMock.expectOne(
      (req) => req.url === `${baseUrl}/${username}` && req.params.get('tenantId') === tenantId
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);

    request.flush(response);

    await expect(promise).resolves.toEqual(response);
  });

  it('should normalize NestJS errors when finding user by username fails', async () => {
    const username = 'nao.existe';
    const tenantId = '00000000-0000-0000-0000-000000000000';

    const promise = adapter.findOneByUsername(username, tenantId);
    const request = httpMock.expectOne(
      (req) => req.url === `${baseUrl}/${username}` && req.params.get('tenantId') === tenantId
    );

    request.flush(
      {
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      },
      { status: 404, statusText: 'Not Found' },
    );

    await expect(promise).rejects.toMatchObject({
      name: 'ApiError',
      message: 'User not found',
      status: 404,
    });
  });
});