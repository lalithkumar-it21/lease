import { TestBed } from '@angular/core/testing';

import { PropertyRequestService } from './property-request.service';

describe('PropertyRequestService', () => {
  let service: PropertyRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PropertyRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
