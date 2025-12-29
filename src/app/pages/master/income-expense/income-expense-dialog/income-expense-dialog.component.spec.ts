import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncomeExpenseDialogComponent } from './income-expense-dialog.component';

describe('IncomeExpenseDialogComponent', () => {
  let component: IncomeExpenseDialogComponent;
  let fixture: ComponentFixture<IncomeExpenseDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IncomeExpenseDialogComponent]
    });
    fixture = TestBed.createComponent(IncomeExpenseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
