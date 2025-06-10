import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnerUpdatedComponent } from './admin-owner-update.component';

describe('AdminOwnerUpdateComponent', () => {
  let component: OwnerUpdatedComponent;
  let fixture: ComponentFixture<OwnerUpdatedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerUpdatedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnerUpdatedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
