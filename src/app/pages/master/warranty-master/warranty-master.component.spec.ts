import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarrantyMasterComponent } from './warranty-master.component';

describe('WarrantyMasterComponent', () => {
  let component: WarrantyMasterComponent;
  let fixture: ComponentFixture<WarrantyMasterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WarrantyMasterComponent]
    });
    fixture = TestBed.createComponent(WarrantyMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
