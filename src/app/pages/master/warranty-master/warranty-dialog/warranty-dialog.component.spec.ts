import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarrantyDialogComponent } from './warranty-dialog.component';

describe('WarrantyDialogComponent', () => {
  let component: WarrantyDialogComponent;
  let fixture: ComponentFixture<WarrantyDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WarrantyDialogComponent]
    });
    fixture = TestBed.createComponent(WarrantyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
