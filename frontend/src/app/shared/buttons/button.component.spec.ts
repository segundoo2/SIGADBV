import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
    }).compileComponents();
  });

  it('should create the component and render the button', () => {
    const fixture = TestBed.createComponent(ButtonComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button');

    expect(button).toBeTruthy();
  });

  it('should show loading spinner and custom loading text when isLoading is true', () => {
    const fixture = TestBed.createComponent(ButtonComponent);
    
    fixture.componentRef.setInput('isLoading', true);
    fixture.componentRef.setInput('loadingText', 'Salvando...');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const spinner = compiled.querySelector('svg.animate-spin');
    const spanText = compiled.querySelector('span');

    expect(spinner).toBeTruthy();
    expect(spanText?.textContent).toContain('Salvando...');
  });

  it('should be disabled when disabled input is true', () => {
    const fixture = TestBed.createComponent(ButtonComponent);
    
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button');

    expect(button?.hasAttribute('disabled')).toBe(true);
  });

  it('should emit onClick event when clicked', () => {
    const fixture = TestBed.createComponent(ButtonComponent);
    const component = fixture.componentInstance;
    
    const clickSpy = vi.fn();
    component.onClick.subscribe(clickSpy);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button');
    button?.click();

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});