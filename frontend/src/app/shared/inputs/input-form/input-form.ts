import { Component, Input, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputFormComponent),
      multi: true,
    },
  ],
  template: `
    <div class="relative w-full">
      <input
        [type]="type"
        [id]="id"
        [attr.data-testid]="testId || null"
        [placeholder]="label"
        [disabled]="disabled()"
        [value]="value()"
        (input)="onInput($event)"
        (blur)="onTouched()"
        class="peer w-full px-4 pt-6 pb-2 sm:pt-7 sm:pb-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm sm:text-base placeholder-transparent focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <label
        [for]="id"
        class="absolute left-4 top-4 sm:top-5 text-slate-400 text-sm sm:text-base transition-all duration-200 pointer-events-none 
               peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-indigo-400 
               peer-not-placeholder-shown:top-1.5 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-slate-400"
      >
        {{ label }}
      </label>

      <div class="min-h-4.5 sm:min-h-5 mt-1 ml-1">
        @if (showError && errorMessage) {
          <span [attr.data-testid]="errorTestId || null" class="block text-[11px] sm:text-xs text-red-400 animate-fadeIn">
            {{ errorMessage }}
          </span>
        }
      </div>
    </div>
  `,
})
export class InputFormComponent implements ControlValueAccessor {
  @Input({ required: true }) id!: string;
  @Input({ required: true }) label!: string;
  @Input() type: 'text' | 'password' | 'email' | 'number' | 'tel' = 'text';
  @Input() testId?: string;
  @Input() errorTestId?: string;
  @Input() showError: boolean = false;
  @Input() errorMessage?: string;

  value = signal<string>('');
  disabled = signal<boolean>(false);

  private onChange: (value: string) => void = () => {};
  public onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
  }
}