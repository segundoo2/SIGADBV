import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect } from 'vitest';
import { ErrorMessageComponent } from './error-message.component';

describe('ErrorMessageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorMessageComponent],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(ErrorMessageComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should display the error message when input is provided', () => {
    const fixture = TestBed.createComponent(ErrorMessageComponent);

    // Passa o valor para o input signal usando setInput
    fixture.componentRef.setInput('message', 'Credenciais inválidas');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const messageSpan = compiled.querySelector('span');
    const container = compiled.querySelector('[data-testid="error-message"]');

    expect(messageSpan?.textContent).toContain('Credenciais inválidas');
    expect(container).toBeTruthy();
  });

  it('should apply collapse classes when message is null', () => {
    const fixture = TestBed.createComponent(ErrorMessageComponent);

    fixture.componentRef.setInput('message', null);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('section');

    // Verifica se a classe de altura máxima zerada está ativa quando não há erro
    expect(section?.classList.contains('max-h-0')).toBe(true);
    expect(section?.classList.contains('opacity-0')).toBe(true);
  });
});
