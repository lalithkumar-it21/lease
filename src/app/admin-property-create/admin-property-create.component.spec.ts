import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPropertyCreateComponent } from './admin-property-create.component';

describe('AdminPropertyCreateComponent', () => {
  let component: AdminPropertyCreateComponent;
  let fixture: ComponentFixture<AdminPropertyCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPropertyCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPropertyCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
