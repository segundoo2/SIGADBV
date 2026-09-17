import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputFormComponent } from './input-form';
import { ReactiveFormsModule } from '@angular/forms';

describe('InputFormComponent', () => {
  let component: InputFormComponent;
  let fixture: ComponentFixture<InputFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputFormComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(InputFormComponent);
    component = fixture.componentInstance;
    
    component.id = 'test-id';
    component.label = 'Test Label';
  });

  it('should create the input form component successfully', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render the label correctly', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    const label = compiled.querySelector('label');

    expect(label).toBeTruthy();
    expect(label.textContent?.trim()).toBe('Test Label');
  });

  it('should render data-testid on the native input when provided', () => {
    component.testId = 'custom-input-test-id';
    fixture.detectChanges(); // Detecta após definir antes do render completo

    const compiled = fixture.nativeElement;
    const inputElement = compiled.querySelector('[data-testid="custom-input-test-id"]');

    expect(inputElement).toBeTruthy();
  });

  it('should not display the error message when showError is false', () => {
    component.showError = false;
    component.errorMessage = 'Campo obrigatório';
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const errorElement = compiled.querySelector('span');

    expect(errorElement).toBeFalsy();
  });

  it('should display the error message and errorTestId when showError is true', () => {
    component.showError = true;
    component.errorMessage = 'Campo obrigatório';
    component.errorTestId = 'custom-error-test-id';
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const errorElement = compiled.querySelector('[data-testid="custom-error-test-id"]');

    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent?.trim()).toBe('Campo obrigatório');
  });

  it('should update value and propagate changes via ControlValueAccessor', () => {
    fixture.detectChanges();
    const fn = vi.fn();
    component.registerOnChange(fn);

    const compiled = fixture.nativeElement;
    const inputElement = compiled.querySelector('input');

    inputElement.value = 'novo valor';
    inputElement.dispatchEvent(new Event('input'));

    expect(component.value()).toBe('novo valor');
    expect(fn).toHaveBeenCalledWith('novo valor');
  });

  it('should write value correctly via ControlValueAccessor writeValue', () => {
    fixture.detectChanges();
    component.writeValue('valor externo');
    fixture.detectChanges();

    expect(component.value()).toBe('valor externo');
  });

  it('should set disabled state correctly', () => {
    fixture.detectChanges();
    component.setDisabledState(true);
    fixture.detectChanges();

    expect(component.disabled()).toBeTruthy();

    const compiled = fixture.nativeElement;
    const inputElement = compiled.querySelector('input');
    expect(inputElement.disabled).toBeTruthy();
  });
});