import { TestBed } from '@angular/core/testing';

import { PropertyCreateService } from './property-create.service';

describe('PropertyCreateService', () => {
  let service: PropertyCreateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PropertyCreateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
