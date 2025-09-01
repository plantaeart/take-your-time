import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadInputComponent } from './upload-input.component';

describe('UploadInputComponent', () => {
  let component: UploadInputComponent;
  let fixture: ComponentFixture<UploadInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
