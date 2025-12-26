import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseMasterDialogComponent } from './purchase-master-dialog.component';

describe('PurchaseMasterDialogComponent', () => {
  let component: PurchaseMasterDialogComponent;
  let fixture: ComponentFixture<PurchaseMasterDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PurchaseMasterDialogComponent]
    });
    fixture = TestBed.createComponent(PurchaseMasterDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
