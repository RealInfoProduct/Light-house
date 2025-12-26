import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryMasterComponent } from './category-master.component';

describe('CategoryMasterComponent', () => {
  let component: CategoryMasterComponent;
  let fixture: ComponentFixture<CategoryMasterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CategoryMasterComponent]
    });
    fixture = TestBed.createComponent(CategoryMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
