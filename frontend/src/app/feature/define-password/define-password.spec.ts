import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DefinePassword } from './define-password';

describe('DefinePassword', () => {
  let component: DefinePassword;
  let fixture: ComponentFixture<DefinePassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefinePassword],
    }).compileComponents();

    fixture = TestBed.createComponent(DefinePassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
