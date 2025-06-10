import { TestBed } from '@angular/core/testing';

import { OwnerUpdateService } from './owner-update.service';

describe('OwnerUpdateService', () => {
  let service: OwnerUpdateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OwnerUpdateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
