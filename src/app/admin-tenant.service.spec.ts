import { TestBed } from '@angular/core/testing';

import { AdminTenantService } from './admin-tenant.service';

describe('AdminTenantService', () => {
  let service: AdminTenantService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminTenantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
