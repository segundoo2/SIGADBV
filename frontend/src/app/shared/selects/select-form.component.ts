import { Component, Input, forwardRef, signal } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';

export interface SelectOption {
  id: string | number;
  name: string;
}

@Component({
  selector: 'app-select-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectFormComponent),
      multi: true,
    },
  ],
  template: `
    <div class="relative w-full space-y-1.5">
      <div class="relative w-full">
        <select
          [id]="id"
          [attr.data-testid]="testId || null"
          [disabled]="disabled()"
          (blur)="onTouched()"
          (change)="onChangeInternal($event)"
          class="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm sm:text-base focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
        >
          <option
            value=""
            [selected]="value() === ''"
            disabled
            class="bg-slate-900 text-slate-400"
          >
            Selecione uma unidade...
          </option>
          @for (option of options; track option.id) {
            <option
              [value]="option.id"
              [selected]="isSelected(option)"
              class="bg-slate-900 text-white"
            >
              {{ option.name }}
            </option>
          }
        </select>

        <!-- Seta estática apontando sempre para baixo -->
        <span
          class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </div>

      @if (showError && errorMessage) {
        <p class="mt-1 ml-1">
          <span
            [attr.data-testid]="errorTestId || null"
            id="error-message"
            class="block text-[11px] sm:text-xs text-red-400 animate-fadeIn"
          >
            {{ errorMessage }}
          </span>
        </p>
      }
    </div>
  `,
})
export class SelectFormComponent implements ControlValueAccessor {
  @Input({ required: true }) id!: string;
  @Input({ required: true }) options: SelectOption[] = [];
  @Input() testId?: string;
  @Input() errorTestId?: string;
  @Input() showError: boolean = false;
  @Input() errorMessage?: string;

  value = signal<string | number>('');
  disabled = signal<boolean>(false);

  private onChange: (value: string | number) => void = () => {};
  public onTouched: () => void = () => {};

  writeValue(value: string | number): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  isSelected(option: SelectOption): boolean {
    const currentValue = this.value();
    return currentValue !== '' && String(option.id) === String(currentValue);
  }

  onChangeInternal(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    const selectedOption = this.options.find(
      (option) => String(option.id) === selectedValue,
    );
    const value = selectedOption?.id ?? '';

    this.value.set(value);
    this.onChange(value);
  }
}