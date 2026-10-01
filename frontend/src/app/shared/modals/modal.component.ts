import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <!-- Backdrop com transição de opacidade -->
      <div 
        class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300"
        (click)="onBackdropClick($event)"
      >
        <!-- Modal Box com transição de escala e fade -->
        <div 
          [class]="modalContainerClass()"
          role="dialog"
          aria-modal="true"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <h3 class="text-lg font-semibold text-white tracking-wide">
              {{ title() }}
            </h3>
            <button
              type="button"
              (click)="close.emit()"
              class="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800 focus:outline-none"
              aria-label="Fechar modal"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 overflow-y-auto text-slate-300 text-sm space-y-4">
            <ng-content />
          </div>

          <!-- Footer (Opcional projetado) -->
          <div class="px-6 py-3 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
            <ng-content select="[modal-footer]" />
          </div>
        </div>
      </div>
    }
  `
})
export class ModalComponent {
  readonly isOpen = input.required<boolean>();
  readonly title = input<string>('Confirmação');
  readonly size = input<ModalSize>('md'); // Novo input para tamanho
  
  readonly close = output<void>();

  // Computed para mapear dinamicamente as classes de largura com base no size
  protected readonly modalContainerClass = computed(() => {
    const baseClasses = 'bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 transform scale-100 opacity-100';
    
    const sizeClasses: Record<ModalSize, string> = {
      sm: 'max-w-sm',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl'
    };

    return `${baseClasses} ${sizeClasses[this.size()]}`;
  });

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}