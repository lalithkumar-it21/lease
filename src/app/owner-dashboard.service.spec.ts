import { TestBed } from '@angular/core/testing';

import { OwnerDashboardService } from './owner-dashboard.service';

describe('OwnerDashboardService', () => {
  let service: OwnerDashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OwnerDashboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
