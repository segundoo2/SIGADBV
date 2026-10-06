import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CardComponent } from '../card.component';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the label and value correctly', () => {
    component.label = 'Unidades Cadastradas';
    component.value = 10;
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Unidades Cadastradas');
    expect(element.textContent).toContain('10');
  });

  it('should render string values correctly', () => {
    component.label = 'Status';
    component.value = 'Ativo';
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Status');
    expect(element.textContent).toContain('Ativo');
  });
});
