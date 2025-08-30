import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonConfirmPopupComponent } from './button-confirm-popup.component';

describe('ButtonConfirmPopupComponent', () => {
  let component: ButtonConfirmPopupComponent;
  let fixture: ComponentFixture<ButtonConfirmPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonConfirmPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ButtonConfirmPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
