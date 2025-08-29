import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuantityControlsComponent } from './quantity-controls.component';

describe('QuantityControlsComponent', () => {
  let component: QuantityControlsComponent;
  let fixture: ComponentFixture<QuantityControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuantityControlsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuantityControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
