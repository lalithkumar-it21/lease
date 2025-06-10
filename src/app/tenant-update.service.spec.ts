import { TestBed } from '@angular/core/testing';

import { TenantUpdateService } from './tenant-update.service';

describe('TenantUpdateService', () => {
  let service: TenantUpdateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TenantUpdateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
