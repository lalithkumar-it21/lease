import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaseManagementComponent } from './lease-management.component';

describe('LeaseManagementComponent', () => {
  let component: LeaseManagementComponent;
  let fixture: ComponentFixture<LeaseManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaseManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaseManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
