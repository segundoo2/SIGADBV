import { Component, ChangeDetectionStrategy, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { SelectFormComponent, SelectOption } from '../../shared/selects/select-form.component';

@Component({
  selector: 'app-table-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SelectFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm space-y-4">
      <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 class="text-lg font-semibold text-white m-0">
          {{ title }}
        </h2>
        
        @if (mutableSelectOptions().length > 0 && selectControl) {
          <div class="w-full sm:w-60 flex items-center">
            <app-select-form
              [id]="selectId"
              [options]="mutableSelectOptions()"
              [formControl]="selectControl"
              [testId]="selectId"
              class="w-full block"
            />
          </div>
        }
      </header>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              @for (header of headers; track header) {
                <th class="py-3 px-4">{{ header }}</th>
              }
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-sm">
            <ng-content></ng-content>
          </tbody>
        </table>
      </div>
    </article>
  `,
})
export class TableCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) headers!: readonly string[];
  @Input() set selectOptions(value: readonly SelectOption[]) {
    this.selectOptionsSignal.set(value);
  }
  @Input() selectControl: FormControl<string> | null = null;
  @Input() selectId: string = 'generic-table-select';

  private readonly selectOptionsSignal = signal<readonly SelectOption[]>([]);

  readonly mutableSelectOptions = computed<SelectOption[]>(() =>
    [...this.selectOptionsSignal()]
  );
}