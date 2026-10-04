import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import { TableCardComponent } from '../table-card.component';

describe('TableCardComponent', () => {
  let component: TableCardComponent;
  let fixture: ComponentFixture<TableCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TableCardComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    component.title = 'Histórico';
    component.headers = ['Pontos', 'Motivo'];
    fixture.detectChanges();

    expect(component).toBeTruthy();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Histórico');
    expect(element.textContent).toContain('Pontos');
    expect(element.textContent).toContain('Motivo');
  });

  it('should render select dropdown when options and control are provided', () => {
    component.title = 'Histórico';
    component.headers = ['Pontos'];
    component.selectOptions = [
      { id: '1', name: 'Unidade A' },
      { id: '2', name: 'Unidade B' },
    ];
    component.selectControl = new FormControl<string>('', { nonNullable: true });
    component.selectId = 'test-select';
    fixture.detectChanges();

    const selectElement = fixture.nativeElement.querySelector('app-select-form');
    expect(selectElement).toBeTruthy();
  });
});