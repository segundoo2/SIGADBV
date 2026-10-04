import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || isLoading()"
      [attr.data-testid]="testId()"
      (click)="clickRequested.emit($event)"
      class="w-full mt-2 h-11 sm:h-12 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium text-sm sm:text-base rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
    >
      @if (isLoading()) {
        <svg
          class="animate-spin -ml-1 mr-3 h-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span>{{ loadingText() }}</span>
      } @else {
        <ng-content />
      }
    </button>
  `,
})
export class ButtonComponent {
  readonly type = input<'submit' | 'button' | 'reset'>('submit');
  readonly disabled = input<boolean>(false);
  readonly isLoading = input<boolean>(false);
  readonly loadingText = input<string>('Carregando...');
  readonly testId = input<string>('submit-btn');

  readonly clickRequested = output<MouseEvent>();
}
