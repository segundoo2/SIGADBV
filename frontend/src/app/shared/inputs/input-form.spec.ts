import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import { InputFormComponent } from './input-form';

describe('InputFormComponent', () => {
  let fixture: ComponentFixture<InputFormComponent>;
  let component: InputFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputFormComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(InputFormComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('id', 'test-input');
    fixture.componentRef.setInput('label', 'Test Label');
    fixture.detectChanges();
  });

  it('should create the component and render label', () => {
    const label = (fixture.nativeElement as HTMLElement).querySelector(
      'label',
    ) as HTMLElement;

    expect(label).not.toBeNull();
    expect(label.textContent?.trim()).toBe('Test Label');
  });

  it('should display error message when showError is true', () => {
    fixture.componentRef.setInput('showError', true);
    fixture.componentRef.setInput('errorMessage', 'Campo obrigatório');
    fixture.componentRef.setInput('errorTestId', 'error-test');
    fixture.detectChanges();

    const errorElement = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="error-test"]',
    ) as HTMLElement;

    expect(errorElement).not.toBeNull();
    expect(errorElement.textContent?.trim()).toBe('Campo obrigatório');
  });

  it('should handle user input and update value through ControlValueAccessor', () => {
    component.writeValue('novo valor');
    fixture.detectChanges();

    const inputElement = (fixture.nativeElement as HTMLElement).querySelector(
      'input',
    ) as HTMLInputElement;

    expect(inputElement).not.toBeNull();
    expect(inputElement.value).toBe('novo valor');
  });

  it('should respect disabled state', () => {
    component.setDisabledState(true);
    fixture.detectChanges();

    const inputElement = (fixture.nativeElement as HTMLElement).querySelector(
      'input',
    ) as HTMLInputElement;

    expect(inputElement).not.toBeNull();
    expect(inputElement.disabled).toBeTruthy();
  });
});
