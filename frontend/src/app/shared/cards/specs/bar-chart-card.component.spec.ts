import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { BarChartCardComponent, ChartItem } from '../bar-chart-card.component';

describe('BarChartCardComponent', () => {
  let component: BarChartCardComponent;
  let fixture: ComponentFixture<BarChartCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChartCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BarChartCardComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    component.title = 'Ranking';
    component.items = [];
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should show empty message when items list is empty or invalid', () => {
    component.title = 'Ranking';
    component.emptyMessage = 'Sem dados disponíveis';
    component.items = [];
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Sem dados disponíveis');
  });

  it('should process items and render chart when valid data is provided', () => {
    component.title = 'Ranking';
    const mockItems: readonly ChartItem[] = [
      { id: '1', label: 'Unidade Alpha', value: 100 },
      { id: '2', label: 'Unidade Beta', value: 200 },
    ];
    component.items = mockItems;
    fixture.detectChanges();

    expect(component.hasData()).toBe(true);
    expect(component.sortedItems().length).toBe(2);
    // O item com maior valor deve vir primeiro devido à ordenação decrescente
    expect(component.sortedItems()[0].label).toBe('Unidade Beta');
  });

  it('should exclude units with zero or negative scores from the chart', () => {
    component.title = 'Ranking';
    component.items = [
      { id: '1', label: 'Unidade positiva', value: 10 },
      { id: '2', label: 'Unidade zerada', value: 0 },
      { id: '3', label: 'Unidade negativa', value: -5 },
    ];

    expect(component.sortedItems().map((item) => item.label)).toEqual([
      'Unidade positiva',
    ]);
    expect(component.hasData()).toBe(true);
  });

  it('should show the empty message when all scores are zero or negative', () => {
    component.title = 'Ranking';
    component.items = [
      { id: '1', label: 'Unidade zerada', value: 0 },
      { id: '2', label: 'Unidade negativa', value: -5 },
    ];
    fixture.detectChanges();

    expect(component.hasData()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Não há dados suficientes para exibir o gráfico',
    );
  });
});
