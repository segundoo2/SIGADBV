import { Injectable } from '@angular/core';
import { ITenantContextPort } from '../../application/ports/tenant-context.port';

@Injectable({
  providedIn: 'root',
})
export class UrlTenantContextAdapter implements ITenantContextPort {
  private readonly mainDomains = ['sgcode.com.br', 'sgcode.com'];

  getTenantSlug(): string | null {
    // implemementar lógica de capturar no input o tenant-slug depois
    return 'sigadbv';
  }
}
