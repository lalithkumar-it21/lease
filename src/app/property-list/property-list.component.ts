// src/app/property-list/property-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router'; // Import Router
import { HttpClientModule } from '@angular/common/http';
import { Property, Request, Owner } from '../registerservice.service';
import { Observable, EMPTY, of, forkJoin } from 'rxjs';
import { PropertyListService } from '../property-list.service';
import { RequestService } from '../request.service';
import { AuthService } from '../auth.service';
import { TenantUpdateService } from '../tenant-update.service'; // Use TenantUpdateService for tenant ID lookup
import { OwnerUpdateService } from '../owner-update.service';
import { switchMap, catchError, tap, map, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Extend Property interface to include tenant-specific request status and request ID for display
interface PropertyWithTenantStatus extends Property {
  hasTenantRequested: boolean;
  tenantRequestStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  tenantRequestId?: number; // Store the request ID here for deletion
}

// Interface for a notification message
interface Notification {
  id: number;
  message: string;
  type: 'success' | 'danger';
}

@Component({
  selector: 'property-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HttpClientModule],
  templateUrl: './property-list.component.html',
  styleUrls: ['./property-list.component.css']
})
export class PropertyListComponent implements OnInit {
  properties: PropertyWithTenantStatus[] = [];
  allProperties: Property[] = [];
  tenantRequestsMap: Map<number, Request> = new Map(); // Map: propertyId -> Full Request object
  previousTenantRequestsMap: Map<number, Request> = new Map(); // To track previous states for notifications
  filterForm: FormGroup;
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;
  currentTenantId: number | null = null;

  notifications: Notification[] = [];
  private nextNotificationId: number = 0;

  showRequestedProperties: boolean = false;

  showOwnerDetailsModal: boolean = false;
  selectedOwner: Owner | null = null;
  ownerDetailsLoading: boolean = false;
  ownerDetailsError: string | null = null;


  availabilityStatuses: ('AVAILABLE' | 'OCCUPIED' | 'UNDER_MAINTENANCE' | 'Any')[] = [
    'AVAILABLE',
    'OCCUPIED',
    'UNDER_MAINTENANCE',
    'Any'
  ];

  constructor(
    private fb: FormBuilder,
    private propertyListService: PropertyListService,
    private requestService: RequestService,
    public authService: AuthService,
    private tenantService: TenantUpdateService,
    private ownerUpdateService: OwnerUpdateService,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      propertyName: [''],
      address: [''],
      minRent: [''],
      maxRent: [''],
      availabilityStatus: ['Any']
    });
  }

  ngOnInit(): void {
    this.refreshView();
    this.setupFilterFormListener();
  }

  setupFilterFormListener(): void {
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  refreshView(): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;
    this.notifications = []; // Clear all notifications on a full refresh

    const propertyFetchObservable = this.propertyListService.getAllProperties();
    const username = this.authService.getUsernameFromToken();

    let tenantIdObservable: Observable<number | null>;
    if (username && this.authService.isTenant()) { // Check if logged in AND is a tenant
      tenantIdObservable = this.tenantService.getTenantIdByUsername(username).pipe(
        catchError(err => {
          console.error('Error fetching tenant ID:', err);
          return of(null); // Return null on error
        })
      );
    } else {
      tenantIdObservable = of(null); // No tenant logged in or not a tenant
    }

    forkJoin([propertyFetchObservable, tenantIdObservable]).pipe(
      switchMap(([propertiesData, tenantId]) => {
        this.allProperties = propertiesData as Property[];

        // NEW: IMPORTANT: Store current tenant requests into previous map BEFORE updating tenantRequestsMap with new data
        this.previousTenantRequestsMap.clear();
        this.tenantRequestsMap.forEach((request, propId) => { // Iterate over Request objects
          this.previousTenantRequestsMap.set(propId, request);
        });
        
        this.currentTenantId = tenantId;

        if (this.currentTenantId) {
          return this.requestService.getRequestsByTenantId(this.currentTenantId).pipe(
            map(requests => [propertiesData, requests]),
            catchError(err => {
              console.error('Error fetching tenant requests:', err);
              return of([propertiesData, [] as Request[]]);
            })
          );
        } else {
          return of([propertiesData, [] as Request[]]);
        }
      })
    ).subscribe({
      next: ([propertiesData, requests]) => {
        this.allProperties = propertiesData as Property[];
        this.tenantRequestsMap.clear(); // Clear for new data
        requests.forEach(req => {
          if (req.propertyId) {
            this.tenantRequestsMap.set(req.propertyId, req); // Store the full Request object
          }
        });
        console.log('DEBUG: Tenant Requests Map (refreshed):', this.tenantRequestsMap);
        console.log('DEBUG: Previous Tenant Requests Map:', this.previousTenantRequestsMap);

        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = `Failed to load data: ${err.message || 'An error occurred.'}`;
        this.loading = false;
        console.error('Error in refreshView:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filteredProperties = [...this.allProperties];

    const { propertyName, address, minRent, maxRent, availabilityStatus } = this.filterForm.value;

    if (propertyName && propertyName.trim()) {
      const lowerCasePropertyName = propertyName.trim().toLowerCase();
      filteredProperties = filteredProperties.filter(p =>
        p.propertyName.toLowerCase().includes(lowerCasePropertyName)
      );
    }

    if (address && address.trim()) {
      const lowerCaseAddress = address.trim().toLowerCase();
      filteredProperties = filteredProperties.filter(p =>
        p.address.toLowerCase().includes(lowerCaseAddress)
      );
    }

    const parsedMinRent = parseFloat(minRent);
    const parsedMaxRent = parseFloat(maxRent);

    if (!isNaN(parsedMinRent) && parsedMinRent >= 0) {
      filteredProperties = filteredProperties.filter(p => p.rentAmount >= parsedMinRent);
    }
    if (!isNaN(parsedMaxRent) && parsedMaxRent >= 0) {
      filteredProperties = filteredProperties.filter(p => p.rentAmount <= parsedMaxRent);
    }

    if (availabilityStatus && availabilityStatus !== 'Any') {
      filteredProperties = filteredProperties.filter(p =>
        p.availabilityStatus === availabilityStatus
      );
    }

    if (this.showRequestedProperties) {
      if (!this.currentTenantId) {
        this.error = 'Please log in as a tenant to view your requested properties.';
        this.properties = [];
        return;
      }
      filteredProperties = filteredProperties.filter(p =>
        this.tenantRequestsMap.has(p.propertyId!)
      );
      if (filteredProperties.length === 0) {
        this.error = 'You have no requested properties matching current filters.';
      } else {
        if (this.error === 'You have no requested properties matching current filters.' || this.error === 'Please log in as a tenant to view your requested properties.') {
          this.error = null;
        }
      }
    } else {
        if (this.error === 'You have no requested properties matching current filters.' || this.error === 'Please log in as a tenant to view your requested properties.') {
           this.error = null;
        }
    }

    // Enrich properties with tenant-specific request status for display
    this.properties = filteredProperties.map(p => {
      const request = this.tenantRequestsMap.get(p.propertyId!); // Get the full Request object
      return {
        ...p,
        hasTenantRequested: this.tenantRequestsMap.has(p.propertyId!),
        tenantRequestStatus: request ? request.requestStatus : undefined, // Get status from full object
        tenantRequestId: request ? request.requestId : undefined // Store request ID from full object
      } as PropertyWithTenantStatus;
    });

    if (this.properties.length === 0 && (propertyName || address || minRent || maxRent || availabilityStatus !== 'Any' || this.showRequestedProperties)) {
      this.error = this.error || 'No properties found matching your criteria.';
    } else if (this.properties.length > 0) {
      this.error = null;
    }

    this.checkAndNotifyStatusChanges();
  }

  private checkAndNotifyStatusChanges(): void {
    // Iterate over the previous requests to find changes
    this.previousTenantRequestsMap.forEach((previousRequest, propertyId) => {
      const currentRequest = this.tenantRequestsMap.get(propertyId);
      const property = this.allProperties.find(p => p.propertyId === propertyId);

      const previousStatus = previousRequest.requestStatus;
      const currentStatus = currentRequest?.requestStatus; // Use optional chaining

      if (property && previousStatus === 'PENDING' && currentStatus && (currentStatus === 'APPROVED' || currentStatus === 'REJECTED')) {
        const notificationId = this.nextNotificationId++;
        let message = '';
        let type: 'success' | 'danger' = 'success';

        if (currentStatus === 'APPROVED') {
          message = `Your request for '${property.propertyName}' has been APPROVED!`;
          type = 'success';
        } else if (currentStatus === 'REJECTED') {
          message = `Your request for '${property.propertyName}' has been REJECTED.`;
          type = 'danger';
        }

        const newNotification: Notification = { id: notificationId, message, type };
        this.notifications.push(newNotification);

        setTimeout(() => {
          this.notifications = this.notifications.filter(n => n.id !== notificationId);
        }, 5000);
      }
    });
  }

  onRequestProperty(property: PropertyWithTenantStatus): void {
    this.error = null;
    this.successMessage = null;
    this.loading = true;

    if (property.hasTenantRequested) {
      this.error = `You have already sent a request for this property (Status: ${property.tenantRequestStatus}).`;
      this.loading = false;
      return;
    }

    if (!this.currentTenantId) {
      this.error = 'You must be logged in as a Tenant to send a request.';
      this.loading = false;
      return;
    }

    const requestPayload: Request = {
      tenantId: this.currentTenantId,
      ownerId: property.ownerId!,
      propertyId: property.propertyId!,
      requestStatus: 'PENDING'
    };

    console.log('Sending request payload:', requestPayload);

    this.requestService.saveRequest(requestPayload).subscribe({
      next: (response) => {
        this.successMessage = 'Request sent successfully!';
        console.log('Request saved:', response);
        this.refreshView(); // Refresh view to update local map and UI, which will also trigger notification check
      },
      error: (err) => {
        this.error = `Failed to send request: ${err.message || err.error || 'An unknown error occurred.'}`;
        console.error('Error in property request flow:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  /**
   * Handles the deletion of a tenant's request for a specific property.
   * @param propertyId The ID of the property for which the request needs to be deleted.
   */
  onDeleteRequest(propertyId: number | undefined): void {
    if (propertyId === undefined || propertyId === null) {
      alert('Error: Property ID is missing for request deletion.');
      return;
    }

    const requestToDelete = this.tenantRequestsMap.get(propertyId);

    if (!requestToDelete || requestToDelete.requestId === undefined || requestToDelete.requestId === null) {
      alert('Error: Could not find an active request or valid request ID for this property.');
      return;
    }

    // Using window.confirm as per previous context; for production, use a custom modal.
    if (window.confirm(`Are you sure you want to delete your request for '${this.allProperties.find(p => p.propertyId === propertyId)?.propertyName || 'this property'}'?`)) {
      this.loading = true;
      this.error = null;
      this.successMessage = null;

      this.requestService.deleteRequest(requestToDelete.requestId).subscribe({
        next: (response) => {
          this.successMessage = 'Request deleted successfully!';
          console.log('Request deletion response:', response);
          this.refreshView(); // Refresh the view to update the property list and button states
        },
        error: (err) => {
          this.error = `Failed to delete request: ${err.message || err.error || 'An unknown error occurred.'}`;
          console.error('Error deleting request:', err);
          alert(this.error);
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }

  // NEW: Navigate to Payment Component
  onRentNow(property: PropertyWithTenantStatus): void {
    console.log('onRentNow triggered for property:', property);
    console.log('Current Tenant Check - isTenant:', this.authService.isTenant(), 'currentTenantId:', this.currentTenantId);

    if (!this.authService.isTenant() || !this.currentTenantId) {
      alert('Please log in as a Tenant to rent a property.');
      return;
    }
    console.log('Tenant check passed.');

    console.log('Availability Status Check:', property.availabilityStatus);
    if (property.availabilityStatus !== 'AVAILABLE') {
        alert(`This property is currently ${property.availabilityStatus.replace('_', ' ').toLowerCase()}. Cannot rent.`);
        return;
    }
    console.log('Availability status check passed.');

    // Log all parameters before navigation
    console.log('Navigating with params:');
    const navParams = [
        property.propertyId,
        property.rentAmount,
        property.period,
        property.ownerId
    ];
    console.log('  propertyId:', navParams[0]);
    console.log('  rentAmount:', navParams[1]);
    console.log('  period:', navParams[2]);
    console.log('  ownerId:', navParams[3]);


    // Validate parameters before navigating
    if (
        !navParams[0] || isNaN(navParams[0]) || // propertyId
        !navParams[1] || isNaN(navParams[1]) || // rentAmount
        !navParams[2] || isNaN(navParams[2]) || // period
        !navParams[3] || isNaN(navParams[3])    // ownerId
    ) {
        this.error = 'One or more required property details (ID, Rent, Period, Owner ID) are missing or invalid.';
        console.error(this.error, property);
        alert(this.error);
        return;
    }
    console.log('All navigation parameters are valid.');

    this.router.navigate([
      '/payment',
      ...navParams // Use spread operator to pass individual parameters
    ]).catch(err => {
        console.error('Router navigation failed. Full error object:', err); // Log the full error object
        this.error = `Failed to navigate to payment page: ${err.message || JSON.stringify(err) || 'Unknown error.'}`;
        alert(this.error);
    });
    console.log('Router navigate call attempted.');
  }


  onToggleShowRequestedProperties(): void {
    if (!this.currentTenantId) {
      this.error = 'Please log in as a tenant to use this feature.';
      this.showRequestedProperties = false;
      return;
    }
    this.showRequestedProperties = !this.showRequestedProperties;
    this.applyFilters();
  }

  onViewOwnerDetails(ownerId: number | undefined): void {
    if (ownerId === undefined || ownerId === null) {
      this.ownerDetailsError = 'Owner ID is missing. Cannot fetch details.';
      return;
    }

    this.ownerDetailsLoading = true;
    this.ownerDetailsError = null;
    this.selectedOwner = null;

    this.ownerUpdateService.getOwnerById(ownerId).pipe(
      catchError(err => {
        this.ownerDetailsError = `Failed to fetch owner details: ${err.message || err.error || 'An unknown error occurred.'}`;
        console.error('Error fetching owner details:', err);
        this.ownerDetailsLoading = false;
        return EMPTY;
      })
    ).subscribe({
      next: (ownerData: Owner) => {
        this.selectedOwner = ownerData;
        this.showOwnerDetailsModal = true;
        this.ownerDetailsLoading = false;
        console.log('Fetched owner details:', ownerData);
      },
      complete: () => {
        this.ownerDetailsLoading = false;
      }
    });
  }

  closeOwnerDetailsModal(): void {
    this.showOwnerDetailsModal = false;
    this.selectedOwner = null;
    this.ownerDetailsError = null;
  }

  onResetFilters(): void {
    this.filterForm.reset({
      propertyName: '',
      address: '',
      minRent: '',
      maxRent: '',
      availabilityStatus: 'Any'
    });
    this.showRequestedProperties = false;
    this.error = null;
    this.successMessage = null;
    this.notifications = [];
    // applyFilters() will be called automatically by valueChanges subscription
  }

  onNotifyClick(): void {
    alert('No new notification yet!');
  }

  getImageSrc(imagePath: string | undefined): string {
    return imagePath && imagePath.trim() !== '' ? imagePath : 'https://placehold.co/300x200/cccccc/333333?text=No+Image';
  }
}
