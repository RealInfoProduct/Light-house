import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalePaymentDetailsComponent } from './sale-payment-details.component';

describe('SalePaymentDetailsComponent', () => {
  let component: SalePaymentDetailsComponent;
  let fixture: ComponentFixture<SalePaymentDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SalePaymentDetailsComponent]
    });
    fixture = TestBed.createComponent(SalePaymentDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
