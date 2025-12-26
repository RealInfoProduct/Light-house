import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShellDialogComponent } from './shell-dialog.component';

describe('ShellDialogComponent', () => {
  let component: ShellDialogComponent;
  let fixture: ComponentFixture<ShellDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ShellDialogComponent]
    });
    fixture = TestBed.createComponent(ShellDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
