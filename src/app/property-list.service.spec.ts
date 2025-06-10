import { TestBed } from '@angular/core/testing';

import { PropertyListService } from './property-list.service';

describe('PropertyListService', () => {
  let service: PropertyListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PropertyListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
