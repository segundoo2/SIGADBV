import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RolesApiAdapter } from '../roles-api.adapter';
import { URL } from '../../tokens/url.token';

describe('RolesApiAdapter', () => {
  let adapter: RolesApiAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RolesApiAdapter,
      ],
    });
    adapter = TestBed.inject(RolesApiAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads all role pages', async () => {
    const promise = adapter.listRoles();
    const first = httpMock.expectOne(
      (request) =>
        request.url === `${URL}/roles` && request.params.get('page') === '1',
    );
    first.flush({
      message: 'Roles',
      data: [{ id: 'r1' }],
      meta: { totalPages: 2 },
    });
    await Promise.resolve();
    const second = httpMock.expectOne(
      (request) =>
        request.url === `${URL}/roles` && request.params.get('page') === '2',
    );
    second.flush({
      message: 'Roles',
      data: [{ id: 'r2' }],
      meta: { totalPages: 2 },
    });
    await expect(promise).resolves.toHaveLength(2);
  });

  it('loads the permissions exposed by backend metadata', async () => {
    const promise = adapter.listPermissions();
    const request = httpMock.expectOne(`${URL}/permissions`);
    expect(request.request.method).toBe('GET');
    request.flush({
      message: 'Permissions',
      data: {
        permissions: ['users.read', 'roles.create'],
        systemAdminRole: 'admin',
      },
    });
    await expect(promise).resolves.toEqual(['users.read', 'roles.create']);
  });

  it('creates a role with its name and permission list', async () => {
    const promise = adapter.createRole({
      name: 'Leitor',
      permissions: ['users.read'],
    });
    const request = httpMock.expectOne(`${URL}/roles`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Leitor',
      permissions: ['users.read'],
    });
    request.flush({ message: 'Created', data: { id: 'r1' } });
    await expect(promise).resolves.toBeUndefined();
  });
});
