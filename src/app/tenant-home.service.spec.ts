import { TestBed } from '@angular/core/testing';

import { TenantHomeService } from './tenant-home.service';

describe('TenantHomeService', () => {
  let service: TenantHomeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TenantHomeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
