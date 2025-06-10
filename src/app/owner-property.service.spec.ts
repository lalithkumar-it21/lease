import { TestBed } from '@angular/core/testing';

import { OwnerPropertyService } from './owner-property.service';

describe('OwnerPropertyService', () => {
  let service: OwnerPropertyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OwnerPropertyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
