import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminTenantComponent } from './admin-tenant.component';

describe('AdminTenantComponent', () => {
  let component: AdminTenantComponent;
  let fixture: ComponentFixture<AdminTenantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTenantComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminTenantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
