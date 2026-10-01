import {
  Component,
  ChangeDetectionStrategy,
  signal,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AUTH_STORE_PORT } from '../../core/infra/tokens/auth.token';

interface SubmenuItem {
  readonly label: string;
  readonly route: string;
}

interface NavItem {
  readonly label: string;
  readonly route?: string;
  readonly submenu?: readonly SubmenuItem[];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly authStore = inject(AUTH_STORE_PORT);

  readonly activeDropdown = signal<string | null>(null);
  readonly isProfileMenuOpen = signal<boolean>(false);
  readonly isMobileMenuOpen = signal<boolean>(false);

  readonly navItems: readonly NavItem[] = [
    { label: 'Visão Geral', route: '/overview' },
    {
      label: 'Unidades',
      route: '/units'
    },
  ];

  toggleDropdown(label: string, event: Event): void {
    event.stopPropagation();
    this.isProfileMenuOpen.set(false);
    this.activeDropdown.update((current) => (current === label ? null : label));
  }

  toggleProfileMenu(event: Event): void {
    event.stopPropagation();
    this.activeDropdown.set(null);
    this.isProfileMenuOpen.update((value) => !value);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((value) => !value);
  }

  closeMenus(): void {
    this.activeDropdown.set(null);
    this.isProfileMenuOpen.set(false);
    this.isMobileMenuOpen.set(false);
  }

  async logout(): Promise<void> {
    this.closeMenus();

    try {
      await this.authStore.logout();
    } finally {
      await this.router.navigateByUrl('/auth', { replaceUrl: true });
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.activeDropdown.set(null);
    this.isProfileMenuOpen.set(false);
  }

  trackByLabel(_index: number, item: NavItem): string {
    return item.label;
  }

  trackBySubRoute(_index: number, item: SubmenuItem): string {
    return item.route;
  }
}
