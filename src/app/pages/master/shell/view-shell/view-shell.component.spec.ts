import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewShellComponent } from './view-shell.component';

describe('ViewShellComponent', () => {
  let component: ViewShellComponent;
  let fixture: ComponentFixture<ViewShellComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ViewShellComponent]
    });
    fixture = TestBed.createComponent(ViewShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
