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

    const element: HTMLElement = fixture.nativeElement;
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
});