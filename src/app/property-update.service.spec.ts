import { TestBed } from '@angular/core/testing';

import { PropertyUpdateService } from './property-update.service';

describe('PropertyUpdateService', () => {
  let service: PropertyUpdateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PropertyUpdateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
