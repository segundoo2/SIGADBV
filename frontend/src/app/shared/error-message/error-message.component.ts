import { Component, input } from '@angular/core';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [],
  template: `
    <section
      class="transition-all duration-300 ease-in-out overflow-hidden"
      [class.max-h-40]="message()"
      [class.max-h-0]="!message()"
      [class.opacity-100]="message()"
      [class.opacity-0]="!message()"
      [class.mb-6]="message()"
      [class.mb-0]="!message()"
      role="alert"
    >
      <div
        data-testid="error-message"
        class="p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm font-medium flex items-center gap-3"
      >
        <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.92 3 1.732 3 z"
          />
        </svg>
        <span>{{ message() }}</span>
      </div>
    </section>
  `,
})
export class ErrorMessageComponent {
  readonly message = input<string | null>(null);
}