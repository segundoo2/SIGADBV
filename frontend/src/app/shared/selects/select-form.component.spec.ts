import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SelectFormComponent, SelectOption } from './select-form.component';

describe('SelectFormComponent', () => {
  let fixture: ComponentFixture<SelectFormComponent>;
  let component: SelectFormComponent;

  const options: SelectOption[] = [
    { id: 'unit-1', name: 'Unidade Alpha' },
    { id: 2, name: 'Unidade Beta' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectFormComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('id', 'unit-select');
    fixture.componentRef.setInput('options', options);
    fixture.detectChanges();
  });

  it('should create the component and render its options', () => {
    const select: HTMLSelectElement =
      fixture.nativeElement.querySelector('select');
    const renderedOptions = Array.from(select.options).map((option) =>
      option.textContent?.trim(),
    );

    expect(component).toBeTruthy();
    expect(select.id).toBe('unit-select');
    expect(renderedOptions).toContain('Selecione uma unidade...');
    expect(renderedOptions).toContain('Unidade Alpha');
    expect(renderedOptions).toContain('Unidade Beta');
  });

  it('should expose the supplied test id', () => {
    fixture.componentRef.setInput('testId', 'unit-select-test');
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="unit-select-test"]'),
    ).toBeTruthy();
  });

  it('should update the selected value when writeValue receives a string', () => {
    component.writeValue('unit-1');
    fixture.detectChanges();

    const select: HTMLSelectElement =
      fixture.nativeElement.querySelector('select');

    expect(component.value()).toBe('unit-1');
    expect(select.value).toBe('unit-1');
  });

  it('should support numeric option ids when writing a value', () => {
    component.writeValue(2);
    fixture.detectChanges();

    const select: HTMLSelectElement =
      fixture.nativeElement.querySelector('select');

    expect(component.value()).toBe(2);
    expect(select.value).toBe('2');
  });

  it('should reset the selected value when writeValue receives null', () => {
    component.writeValue(null as unknown as string);
    fixture.detectChanges();

    const select: HTMLSelectElement =
      fixture.nativeElement.querySelector('select');

    expect(component.value()).toBe('');
    expect(select.value).toBe('');
  });

  it('should notify the registered change callback when an option is selected', () => {
    const onChange = vi.fn();
    component.registerOnChange(onChange);

    const select: HTMLSelectElement =
      fixture.nativeElement.querySelector('select');
    select.value = 'unit-1';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.value()).toBe('unit-1');
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('unit-1');
  });

  it('should notify the registered touched callback when the select loses focus', () => {
    const onTouched = vi.fn();
    component.registerOnTouched(onTouched);

    const select: HTMLSelectElement =
      fixture.nativeElement.querySelector('select');
    select.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(onTouched).toHaveBeenCalledOnce();
  });

  it('should disable the select when setDisabledState receives true', () => {
    component.setDisabledState(true);
    fixture.detectChanges();

    const select: HTMLSelectElement =
      fixture.nativeElement.querySelector('select');

    expect(component.disabled()).toBe(true);
    expect(select.disabled).toBe(true);
  });

  it('should enable the select when setDisabledState receives false', () => {
    component.setDisabledState(true);
    component.setDisabledState(false);
    fixture.detectChanges();

    const select: HTMLSelectElement =
      fixture.nativeElement.querySelector('select');

    expect(component.disabled()).toBe(false);
    expect(select.disabled).toBe(false);
  });

  it('should display the error message when errors are enabled', () => {
    fixture.componentRef.setInput('showError', true);
    fixture.componentRef.setInput('errorMessage', 'Selecione uma unidade.');
    fixture.componentRef.setInput('errorTestId', 'unit-select-error');
    fixture.detectChanges();

    const error: HTMLElement | null = fixture.nativeElement.querySelector(
      '[data-testid="unit-select-error"]',
    );

    expect(error).toBeTruthy();
    expect(error?.textContent?.trim()).toBe('Selecione uma unidade.');
  });

  it('should not display the error message when errors are disabled', () => {
    fixture.componentRef.setInput('showError', false);
    fixture.componentRef.setInput('errorMessage', 'Selecione uma unidade.');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#error-message')).toBeNull();
  });

  it('should not display an error message when no message is provided', () => {
    fixture.componentRef.setInput('showError', true);
    fixture.componentRef.setInput('errorMessage', undefined);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#error-message')).toBeNull();
  });
});
