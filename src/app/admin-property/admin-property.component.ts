// src/app/property-list/property-list.component.ts
import { Component, OnInit } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { Property, Request, Owner } from '../registerservice.service';
import { Observable, EMPTY, of, forkJoin } from 'rxjs';
import { PropertyListService } from '../property-list.service';
import { RequestService } from '../request.service';
import { AuthService } from '../auth.service';
import { TenantService } from '../tenant.service';
import { OwnerUpdateService } from '../owner-update.service';
import { switchMap, catchError, tap, map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PropertyUpdateService } from '../property-update.service';

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
  selector: 'admin-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HttpClientModule],
  templateUrl: './admin-property.component.html',
  styleUrls: ['./admin-property.component.css']
})
export class AdminPropertyListComponent implements OnInit {
  properties: PropertyWithTenantStatus[] = [];
  allProperties: Property[] = [];
  // Changed Map value to full Request object to access requestId
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
    private authService: AuthService,
    private router: Router,
    private tenantService: TenantService,
    private propertyUpdateService: PropertyUpdateService,
    private ownerUpdateService: OwnerUpdateService
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
   // this.loadOwnerIdAndProperties();
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
        console.log('DEBUG: admin Requests Map (refreshed):', this.tenantRequestsMap);
        console.log('DEBUG: admin Tenant Requests Map:', this.previousTenantRequestsMap);

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


  onDeleteProperty(propertyId: number | undefined): void {
    if (propertyId === undefined || propertyId === null) {
      alert('Error: Property ID is missing. Cannot delete.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      this.loading = true;
      this.error = null;
      this.successMessage = null;

      this.propertyUpdateService.deleteProperty(propertyId).subscribe({ // Corrected: Used propertyUpdateService
        next: (response) => {
          this.successMessage = 'Property deleted successfully!';
          console.log('Property delete response:', response);

const decoded = jwtDecode<JwtPayload>(response);
            const roles: string = decoded.roles ?? 'No role found';
            console.log("Decoded Roles:", roles);

            // Consider using localStorage for role if it needs to persist
            // localStorage.setItem("role", roles); // Option to store role persistently
            sessionStorage.setItem("role", roles);


          const role = roles.toLowerCase(); 
          if (role === 'admin') {
            this.router.navigate(["/admin-property"]);}
         // this.loadOwnerIdAndProperties(); // Re-load properties after deletion
        },
        error: (err) => {
          this.error = `Failed to delete property: ${err.message || err.error || 'An error occurred.'}`;
          console.error('Error deleting property:', err);
          alert(this.error);
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }

  /**
   * Navigates to the property update page for a specific property.
   * @param property The property object to edit.
   */
  onEditProperty(property: Property): void {
    console.log('Edit property clicked:', property);
    if (property.propertyId !== undefined && property.propertyId !== null) {
      // Navigate to the property-update component, passing the propertyId as a route parameter
      this.router.navigate(['/property-update', property.propertyId]);
    } else {
      alert('Error: Cannot edit property. Property ID is missing.');
      console.error('Cannot navigate to edit: Property ID is missing for property:', property);
    }
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
interface JwtPayload {
  roles?: string;
  sub?: string;
  iat?: number;
  exp?: number;
}
// loadOwnerIdAndProperties(): void {
//   this.loading = true;
//   this.error = null;
//   this.successMessage = null;
//   this.properties = []; // Clear properties before loading

//   const ownerName = this.authService.getUsernameFromToken();
//   console.log('OwnerPropertyComponent: Loading properties for owner name:', ownerName);

//   if (!ownerName) {
//     this.error = 'You are not logged in as an Owner. Please log in again.';
//     console.error('OwnerPropertyComponent: No owner name found from token. Redirecting to login.');
//     // Using alert() as per user's previous code, consider a modal/toast for better UX.
//     alert(this.error);
//     this.router.navigate(['/login']);
//     this.loading = false;
//     return;
//   }

//   // First, get ownerId by name, then use it to fetch ALL properties and filter them
//   this.ownerUpdateService.getOwnerIdByName(ownerName).pipe(
//     tap(ownerId => console.log('OwnerPropertyComponent: Fetched owner ID:', ownerId)),
//     switchMap((ownerId: number) => { // Explicitly type ownerId as number
//       if (ownerId === null || ownerId === undefined || isNaN(ownerId) || ownerId <= 0) { // Added isNaN check
//         throw new Error('Could not retrieve a valid Owner ID for the current user.');
//       }
//       this.currentOwnerId = ownerId; // Store for later use

//       // Fetch all properties, then filter by the current owner's ID
//       return this.propertyUpdateService.fetchAllProperties().pipe(
//         map((allProperties: Property[]) => { // Explicitly type allProperties as Property[]
//           return allProperties.filter(p => p.ownerId === this.currentOwnerId);
//         })
//       );
//     }),
//     catchError(err => {
//       this.error = `Failed to load owner's properties: ${err.message || 'An error occurred.'}`;
//       console.error('OwnerPropertyComponent: Error in chained fetch for properties:', err);
//       alert(this.error);
//       this.router.navigate(['/owner-home']); // Redirect back to owner home or login on error
//       this.loading = false;
//       return EMPTY; // Stop the observable chain
//     })
//   ).subscribe({
//     next: (data: Property[]) => { // Explicitly type data as Property[]
//       this.properties = data;
//       this.loading = false;
//       if (this.properties.length === 0) {
//         this.error = 'No properties found for your account.';
//       }
//       // Apply filter initially or re-apply after loading
//       this.applyFilter();
//     },
//     error: () => { // Error already handled in catchError pipe, but kept for clarity
//       this.loading = false;
//     },
//     complete: () => {
//       this.loading = false;
//     }
//   });
// }
