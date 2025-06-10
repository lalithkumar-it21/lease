import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyRequestComponent } from './property-request.component';

describe('PropertyRequestComponent', () => {
  let component: PropertyRequestComponent;
  let fixture: ComponentFixture<PropertyRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
