import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="bg-slate-900 border border-slate-800 px-5 py-3 rounded-xl shadow-sm flex items-center gap-4 w-full sm:w-auto">
      <figure class="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 flex items-center justify-center m-0">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
          <line x1="4" y1="22" x2="4" y2="15"></line>
        </svg>
      </figure>
      <div>
        <span class="block text-xs font-medium text-slate-400 uppercase tracking-wider">{{ label }}</span>
        <span class="text-xl font-bold text-white">{{ value }}</span>
      </div>
    </article>
  `,
})
export class CardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: number | string;
}