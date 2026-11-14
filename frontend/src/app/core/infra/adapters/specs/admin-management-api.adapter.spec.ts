import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AdminManagementApiAdapter } from '../admin-management-api.adapter';
import { URL } from '../../tokens/url.token';

describe('AdminManagementApiAdapter', () => {
  let adapter: AdminManagementApiAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AdminManagementApiAdapter,
      ],
    });
    adapter = TestBed.inject(AdminManagementApiAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads every user page using the backend maximum page size', async () => {
    const promise = adapter.listUsers();
    const first = httpMock.expectOne(
      (request) =>
        request.url === `${URL}/users` &&
        request.params.get('page') === '1' &&
        request.params.get('limit') === '100',
    );
    first.flush({
      message: 'Users',
      data: [{ id: 'u1' }],
      meta: { totalPages: 2 },
    });
    await Promise.resolve();
    const second = httpMock.expectOne(
      (request) =>
        request.url === `${URL}/users` && request.params.get('page') === '2',
    );
    second.flush({
      message: 'Users',
      data: [{ id: 'u2' }],
      meta: { totalPages: 2 },
    });
    await expect(promise).resolves.toHaveLength(2);
  });

  it('posts a user with username and selected role ids and returns the initial password', async () => {
    const promise = adapter.createUser({
      username: 'novo.usuario',
      roleIds: ['role-1'],
    });
    const request = httpMock.expectOne(`${URL}/users`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      username: 'novo.usuario',
      roleIds: ['role-1'],
    });
    expect(request.request.withCredentials).toBe(true);
    request.flush({
      message: 'Created',
      data: { temporaryPassword: 'init12345' },
    });
    await expect(promise).resolves.toBe('init12345');
  });

  it('posts to the username temporary password endpoint and returns the password', async () => {
    const promise = adapter.resetTemporaryPassword('edilson.segundo');
    const request = httpMock.expectOne(
      `${URL}/users/edilson.segundo/temporary-password`,
    );
    expect(request.request.method).toBe('POST');
    request.flush({
      message: 'Reset',
      data: { temporaryPassword: 'reset12345' },
    });
    await expect(promise).resolves.toBe('reset12345');
  });
});
