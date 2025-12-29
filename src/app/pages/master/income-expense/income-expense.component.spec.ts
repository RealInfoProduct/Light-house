import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncomeExpenseComponent } from './income-expense.component';

describe('IncomeExpenseComponent', () => {
  let component: IncomeExpenseComponent;
  let fixture: ComponentFixture<IncomeExpenseComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IncomeExpenseComponent]
    });
    fixture = TestBed.createComponent(IncomeExpenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
