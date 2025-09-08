import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabColumnsHeaderComponent } from './tab-columns-header.component';

describe('TabColumnsHeaderComponent', () => {
  let component: TabColumnsHeaderComponent;
  let fixture: ComponentFixture<TabColumnsHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabColumnsHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabColumnsHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
