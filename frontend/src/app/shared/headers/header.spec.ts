import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_STORE_PORT } from '../../core/infra/tokens/auth.token';
import { HeaderComponent } from './header';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let router: Router;
  let authStore: { logout: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authStore = { logout: vi.fn().mockResolvedValue(undefined) };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        { provide: AUTH_STORE_PORT, useValue: authStore },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the current navigation links and routes', () => {
    const links = Array.from(
      fixture.nativeElement.querySelectorAll('nav a'),
    ) as HTMLAnchorElement[];

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'Visão Geral',
      'Unidades',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/overview',
      '/units',
    ]);
  });

  it('should open and close the profile menu', () => {
    const profileButton: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        'button[aria-label="Perfil do usuário"]',
      );

    profileButton.click();
    fixture.detectChanges();

    expect(component.isProfileMenuOpen()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Sair');

    profileButton.click();
    fixture.detectChanges();

    expect(component.isProfileMenuOpen()).toBe(false);
  });

  it('should close the dropdown when the profile menu opens', () => {
    component.activeDropdown.set('Unidades');

    const event = { stopPropagation: vi.fn() } as unknown as Event;
    component.toggleProfileMenu(event);

    expect(event.stopPropagation).toHaveBeenCalledOnce();
    expect(component.activeDropdown()).toBeNull();
    expect(component.isProfileMenuOpen()).toBe(true);
  });

  it('should toggle the mobile navigation and render its links', () => {
    component.toggleMobileMenu();
    fixture.detectChanges();

    expect(component.isMobileMenuOpen()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Visão Geral');
    expect(fixture.nativeElement.textContent).toContain('Unidades');

    component.toggleMobileMenu();
    fixture.detectChanges();

    expect(component.isMobileMenuOpen()).toBe(false);
  });

  it('should close all menus when closeMenus is called', () => {
    component.activeDropdown.set('Unidades');
    component.isProfileMenuOpen.set(true);
    component.isMobileMenuOpen.set(true);

    component.closeMenus();

    expect(component.activeDropdown()).toBeNull();
    expect(component.isProfileMenuOpen()).toBe(false);
    expect(component.isMobileMenuOpen()).toBe(false);
  });

  it('should close the dropdown and profile menu when the document is clicked', () => {
    component.activeDropdown.set('Unidades');
    component.isProfileMenuOpen.set(true);

    component.onDocumentClick();

    expect(component.activeDropdown()).toBeNull();
    expect(component.isProfileMenuOpen()).toBe(false);
  });

  it('should log out and navigate to /auth', async () => {
    const navigateByUrl = vi
      .spyOn(router, 'navigateByUrl')
      .mockResolvedValue(true);

    component.isProfileMenuOpen.set(true);
    component.isMobileMenuOpen.set(true);

    await component.logout();

    expect(authStore.logout).toHaveBeenCalledOnce();
    expect(component.isProfileMenuOpen()).toBe(false);
    expect(component.isMobileMenuOpen()).toBe(false);
    expect(navigateByUrl).toHaveBeenCalledWith('/auth', {
      replaceUrl: true,
    });
  });

  it('should navigate to /auth even when logout rejects', async () => {
    authStore.logout.mockRejectedValueOnce(new Error('Logout failed'));

    const navigateByUrl = vi
      .spyOn(router, 'navigateByUrl')
      .mockResolvedValue(true);

    await expect(component.logout()).rejects.toThrow('Logout failed');

    expect(authStore.logout).toHaveBeenCalledOnce();
    expect(navigateByUrl).toHaveBeenCalledWith('/auth', {
      replaceUrl: true,
    });
  });

  it('should invoke logout when the Sair button is clicked', async () => {
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const profileButton: HTMLButtonElement =
      fixture.nativeElement.querySelector(
        'button[aria-label="Perfil do usuário"]',
      );

    profileButton.click();
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;

    const logoutButton = Array.from(buttons).find((button) =>
      button.textContent?.includes('Sair'),
    );

    expect(logoutButton).toBeTruthy();

    (logoutButton as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(authStore.logout).toHaveBeenCalledOnce();
  });
});
