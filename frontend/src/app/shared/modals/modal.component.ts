import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button
          type="button"
          class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
          aria-label="Fechar modal"
          (click)="closed.emit()"
        ></button>
        <article
          [class]="modalContainerClass()"
          role="dialog"
          aria-modal="true"
        >
          <header
            class="flex items-center justify-between px-6 py-4 border-b border-slate-800"
          >
            <h3 class="text-lg font-semibold text-white tracking-wide">
              {{ title() }}
            </h3>
            <button
              type="button"
              (click)="closed.emit()"
              class="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800 focus:outline-none"
              aria-label="Fechar modal"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </header>

          <div class="p-6 overflow-y-auto text-slate-300 text-sm space-y-4">
            <ng-content />
          </div>

          <footer
            class="px-6 py-3 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3"
          >
            <ng-content select="[modal-footer]" />
          </footer>
        </article>
      </div>
    }
  `,
})
export class ModalComponent {
  readonly isOpen = input.required<boolean>();
  readonly title = input<string>('Confirmação');
  readonly size = input<ModalSize>('md'); // Novo input para tamanho

  readonly closed = output<void>();

  protected readonly modalContainerClass = computed(() => {
    const baseClasses =
      'relative z-10 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 transform scale-100 opacity-100';

    const sizeClasses: Record<ModalSize, string> = {
      sm: 'max-w-sm',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
    };

    return `${baseClasses} ${sizeClasses[this.size()]}`;
  });
}
