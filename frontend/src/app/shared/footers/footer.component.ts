import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="w-full py-10 mt-auto border-t border-slate-900 text-center text-xs text-slate-500 space-y-1">
      <p class="m-0">
        &copy; 2026 SIGADBV. Todos os direitos reservados.
      </p>
      <p class="m-0 text-slate-400 font-medium">
        SG Code by Edilson Segundo
      </p>
    </footer>
  `,
})
export class FooterComponent {}