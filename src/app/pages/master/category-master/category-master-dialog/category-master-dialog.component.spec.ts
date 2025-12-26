import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryMasterDialogComponent } from './category-master-dialog.component';

describe('CategoryMasterDialogComponent', () => {
  let component: CategoryMasterDialogComponent;
  let fixture: ComponentFixture<CategoryMasterDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CategoryMasterDialogComponent]
    });
    fixture = TestBed.createComponent(CategoryMasterDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
