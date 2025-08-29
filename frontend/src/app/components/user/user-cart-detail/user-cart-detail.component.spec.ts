import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserCartDetailComponent } from './user-cart-detail.component';

describe('UserCartDetailComponent', () => {
  let component: UserCartDetailComponent;
  let fixture: ComponentFixture<UserCartDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCartDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserCartDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
