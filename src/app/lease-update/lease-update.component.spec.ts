import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaseUpdateComponent } from './lease-update.component';

describe('LeaseUpdateComponent', () => {
  let component: LeaseUpdateComponent;
  let fixture: ComponentFixture<LeaseUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaseUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaseUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
