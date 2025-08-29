import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserWishlistDetailComponent } from './user-wishlist-detail.component';

describe('UserWishlistDetailComponent', () => {
  let component: UserWishlistDetailComponent;
  let fixture: ComponentFixture<UserWishlistDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserWishlistDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserWishlistDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
