import { Injectable } from '@angular/core';
import { ITenantContextPort } from '../../domain/ports/tenant-context.port';

@Injectable({
  providedIn: 'root',
})
export class UrlTenantContextAdapter implements ITenantContextPort {
  private readonly mainDomains = ['sgcode.com.br', 'sgcode.com'];

  getTenantSlug(): string | null {
    const hostname = window.location.hostname;

    if (this.mainDomains.includes(hostname) || hostname === 'localhost') {
      return null;
    }

    const parts = hostname.split('.');

    // Subdomínio local (ex: tenant.localhost)
    if (parts.length === 2 && parts[1] === 'localhost') {
      return parts[0];
    }

    // Subdomínio de produção (ex: tenant.sgcode.com.br -> possui mais partes que o domínio base)
    if (parts.length > 3) {
      return parts[0];
    }

    return null;
  }
}