import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaseCreateComponent } from './lease-create.component';

describe('LeaseCreateComponent', () => {
  let component: LeaseCreateComponent;
  let fixture: ComponentFixture<LeaseCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaseCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaseCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
