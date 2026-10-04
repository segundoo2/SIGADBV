import { Component, ChangeDetectionStrategy, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartConfiguration,
  ChartOptions,
  ChartType,
  BarElement,
  CategoryScale,
  LinearScale,
  BarController,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, BarController, Tooltip, Legend);

export interface ChartItem {
  readonly id: string;
  readonly label: string;
  readonly value: number;
}

@Component({
  selector: 'app-bar-chart-card',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm flex flex-col justify-between h-full">
      <header>
        <h2 class="text-lg font-semibold text-white mb-4">{{ title }}</h2>
      </header>

      @if (hasData()) {
        <div class="flex-1 w-full h-full min-h-120">
          <canvas
            baseChart
            [data]="barChartData()"
            [options]="barChartOptions"
            [type]="barChartType"
          >
          </canvas>
        </div>
      } @else {
        <p class="flex-1 flex items-center justify-center min-h-120 text-slate-500 text-sm m-0">
          {{ emptyMessage }}
        </p>
      }
    </article>
  `,
})
export class BarChartCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) set items(value: readonly ChartItem[]) {
    this.itemsSignal.set(value);
  }
  @Input() emptyMessage: string = 'Não há dados suficientes para exibir o gráfico';

  private readonly itemsSignal = signal<readonly ChartItem[]>([]);

  readonly sortedItems = computed(() => {
    const list = [...this.itemsSignal()];
    return list
      .filter((item) => item.value >= 0)
      .sort((a, b) => b.value - a.value);
  });

  readonly hasData = computed(() => {
    const list = this.itemsSignal();
    return list.length > 0 && list.some((item) => item.value >= 0);
  });

  readonly barChartType: ChartType = 'bar';

  readonly barChartOptions: ChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { display: false, grid: { display: false } },
      y: {
        grid: { display: false },
        ticks: { color: '#cbd5e1', font: { size: 13, weight: 500 } },
        border: { display: false },
      },
    },
  };

  readonly barChartData = computed<ChartConfiguration['data']>(() => ({
    labels: this.sortedItems().map((item) => item.label),
    datasets: [
      {
        data: this.sortedItems().map((item) => item.value),
        backgroundColor: '#6366f1',
        borderRadius: 6,
        barThickness: 30,
      },
    ],
  }));
}