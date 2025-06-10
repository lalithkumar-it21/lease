import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnerPropertyComponent } from './owner-property-management.component';

describe('OwnerPropertyManagementComponent', () => {
  let component: OwnerPropertyComponent;
  let fixture: ComponentFixture<OwnerPropertyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerPropertyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnerPropertyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
