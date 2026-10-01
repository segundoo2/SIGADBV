import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { AUTH_STORE_PORT } from '../../core/infra/tokens/auth.token';
import { Overview } from './overview';

describe('Overview', () => {
  let component: Overview;
  let fixture: ComponentFixture<Overview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Overview],
      providers: [
        provideRouter([]),
        { provide: AUTH_STORE_PORT, useValue: { logout: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Overview);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the fake overview metrics and score history', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.textContent).toContain('850');
    expect(element.textContent).toContain('5');
    expect(element.textContent).toContain('Gavião-Real');
    expect(element.textContent).toContain('Águia Dourada');
    expect(element.textContent).toContain('Falcão Peregrino');
  });

  it('should render one table row per score history record', () => {
    const rows: NodeListOf<HTMLTableRowElement> =
      fixture.nativeElement.querySelectorAll('tbody tr');

    expect(rows.length).toBe(component.scoreHistory.length);
  });

  it('should return a stable id for each score history row', () => {
    component.scoreHistory.forEach((record, index) => {
      expect(component.trackById(index, record)).toBe(record.id);
    });
  });
});
