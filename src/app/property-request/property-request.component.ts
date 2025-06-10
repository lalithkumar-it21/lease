// src/app/property-request/property-request.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // Removed RouterLink as it's not used directly in this component's template
import { HttpClientModule } from '@angular/common/http';
// Aliased Request as AppRequest to avoid conflict with DOM's global Request interface
import { Property, Request as AppRequest, Tenant, Owner } from '../registerservice.service'; // Import core interfaces
import { Observable, EMPTY, of, forkJoin } from 'rxjs';
 // Our dedicated service for requests
import { AuthService } from '../auth.service';
import { OwnerUpdateService } from '../owner-update.service'; // To get ownerId by name & get owner details
import { PropertyUpdateService } from '../property-update.service'; // To get property details by ID (NEWLY CREATED)
import { TenantUpdateService } from '../tenant-update.service'; // To get tenant details by ID
import { switchMap, catchError, tap, map } from 'rxjs/operators';
import { PropertyRequestService } from '../property-request.service';

// Interface to enrich Request data with Property and Tenant info for display
interface RequestDisplayItem extends AppRequest { // Use AppRequest here
  propertyName: string;
  propertyAddress: string;
  propertyImage: string;
  propertyRentAmount: number;
  propertyPeriod: number;
  propertyDetails: string;
  propertyAvailabilityStatus: 'AVAILABLE' | 'OCCUPIED' | 'UNDER_MAINTENANCE';
  tenantName: string; // Add tenant name for display
  tenantEmail: string; // Add tenant email for display
  tenantContact: string; // Add tenant contact for display
  tenantAddress: string; // Add tenant address for display
}

@Component({
  selector: 'app-property-request', // Changed selector to 'app-property-request' for convention
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule], // Removed RouterLink
  templateUrl: './property-request.component.html',
  styleUrls: ['./property-request.component.css']
})
export class PropertyRequestComponent implements OnInit {
  requests: RequestDisplayItem[] = []; // Requests enriched with property/tenant details for display
  allProperties: Property[] = []; // Cache all properties for lookup
  allTenants: Map<number, Tenant> = new Map(); // Cache all tenants for lookup
  
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;
  currentOwnerId: number | null = null;

  // Search/Filter states
  searchQuery: string = '';
  filterOption: 'all' | 'pending' | 'approved' | 'rejected' = 'all';

  // Modals state
  showPropertyDetailsModal: boolean = false;
  selectedProperty: Property | null = null;
  propertyDetailsLoading: boolean = false;
  propertyDetailsError: string | null = null;

  showTenantDetailsModal: boolean = false;
  selectedTenant: Tenant | null = null;
  tenantDetailsLoading: boolean = false;
  tenantDetailsError: string | null = null;

  showUpdateRequestModal: boolean = false;
  requestToUpdate: AppRequest | null = null; // Use AppRequest here
  newRequestStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | '' = '';
  updateRequestError: string | null = null;

  showDeleteRequestConfirmModal: boolean = false;
  requestToDeleteId: number | null = null;
  requestToDeleteSummary: string = ''; // For display in modal
propertyToDeleteName: any;

  constructor(
    private propertyRequestService: PropertyRequestService, // Dedicated service
    private authService: AuthService,
    private ownerUpdateService: OwnerUpdateService, // Inject PropertyUpdateService
    private propertyUpdateService: PropertyUpdateService, // Inject PropertyUpdateService
    private tenantUpdateService: TenantUpdateService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadOwnerIdAndRequests();
  }

  /**
   * Loads the current owner's ID and then fetches all requests directed to them.
   * Also pre-fetches all properties and tenants for efficient lookup.
   */
  loadOwnerIdAndRequests(): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    const ownerName = this.authService.getUsernameFromToken();
    if (!ownerName) {
      this.displayMessage('You are not logged in as an Owner. Please log in again.', 'danger');
      setTimeout(() => this.router.navigate(['/login']), 2000);
      this.loading = false;
      return;
    }

    this.ownerUpdateService.getOwnerIdByName(ownerName).pipe(
      switchMap(ownerId => {
        if (!ownerId || ownerId <= 0) {
          throw new Error('Could not retrieve a valid Owner ID for the current user.');
        }
        this.currentOwnerId = ownerId;
        
        // Fetch all necessary data in parallel: owner's requests and all properties
        return forkJoin([
          this.propertyRequestService.getRequestsByOwnerId(ownerId),
          this.propertyUpdateService.fetchAllProperties() // Use fetchAllProperties from PropertyUpdateService
        ]).pipe(
          catchError(err => {
            console.error('Error fetching requests or properties:', err);
            this.displayMessage(`Error fetching requests or related data: ${err.message || 'An error occurred.'}`, 'danger');
            return of([[] as AppRequest[], [] as Property[]]); // Use AppRequest here
          })
        );
      }),
      switchMap(([requestsData, propertiesData]) => {
        this.allProperties = propertiesData as Property[];
        const tenantIdsToFetch = new Set<number>();
        requestsData.forEach(req => tenantIdsToFetch.add(req.tenantId));

        // Fetch tenant details for unique tenant IDs involved in requests
        const tenantFetches: Observable<Tenant | null>[] = Array.from(tenantIdsToFetch).map(tenantId => 
          this.tenantUpdateService.getTenantDetailsById(tenantId).pipe(
            catchError(err => {
              console.warn(`Could not fetch tenant details for ID ${tenantId}:`, err);
              return of(null); // Return null for failed tenant fetches
            })
          )
        );

        // Combine requestsData, propertiesData, and the results of tenant fetches
        return forkJoin([of(requestsData), of(propertiesData), ...tenantFetches]).pipe(
          map(([reqs, props, ...tenants]) => {
            const validTenants = tenants.filter(t => t !== null) as Tenant[];
            this.allTenants.clear(); // Clear existing map
            validTenants.forEach(t => this.allTenants.set(t.tenantId!, t));
            return reqs as AppRequest[]; // Use AppRequest here
          })
        );
      }),
      catchError(err => {
        this.error = `Failed to load data: ${err.message || 'An error occurred.'}`;
        this.displayMessage(this.error, 'danger');
        setTimeout(() => this.router.navigate(['/owner-home']), 2000); // Redirect on critical error
        this.loading = false;
        return EMPTY;
      })
    ).subscribe({
      next: (requests: AppRequest[]) => { // Use AppRequest here
        this.requests = this.enrichRequestsForDisplay(requests);
        this.applyFilters(); // Apply initial filters
        this.loading = false;
        if (this.requests.length === 0) {
          this.error = 'No property requests found for your account.';
        }
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  /**
   * Enriches raw Request objects with Property and Tenant details for display.
   * @param requests The array of raw Request objects.
   * @returns An array of RequestDisplayItem objects.
   */
  private enrichRequestsForDisplay(requests: AppRequest[]): RequestDisplayItem[] { // Use AppRequest here
    return requests.map(req => {
      const property = this.allProperties.find(p => p.propertyId === req.propertyId);
      const tenant = this.allTenants.get(req.tenantId);

      return {
        ...req,
        propertyName: property?.propertyName || 'N/A',
        propertyAddress: property?.address || 'N/A',
        propertyImage: property?.image || '',
        propertyRentAmount: property?.rentAmount || 0,
        propertyPeriod: property?.period || 0,
        propertyDetails: property?.propertyDetails || 'N/A',
        propertyAvailabilityStatus: property?.availabilityStatus || 'N/A' as any, // Cast due to 'N/A'
        tenantName: tenant?.name || 'N/A',
        tenantEmail: tenant?.email || 'N/A',
        tenantContact: tenant?.contact || 'N/A',
        tenantAddress: tenant?.address || 'N/A'
      };
    });
  }

  /**
   * Applies search and filter criteria to the requests.
   */
  applyFilters(): void {
    let filteredRequests = this.enrichRequestsForDisplay(
      // Re-enrich from original data to ensure filters are applied correctly
      // based on the current allProperties and allTenants caches,
      // as `this.requests` gets filtered in place by this method.
      // A more robust approach might be to keep a `rawRequests` array and always filter from it.
      // For now, let's assume `this.requests` is reset from raw data on `loadOwnerIdAndRequests`
      // and this `applyFilters` just refines the current `this.requests`.
      // Re-filtering from `requests` itself:
      [...this.requests] // Create a shallow copy to filter
    );

    // Filter by search query (property name, address, tenant name, request status)
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.trim().toLowerCase();
      filteredRequests = filteredRequests.filter(req =>
        req.propertyName.toLowerCase().includes(query) ||
        req.propertyAddress.toLowerCase().includes(query) ||
        req.tenantName.toLowerCase().includes(query) ||
        req.requestStatus.toLowerCase().includes(query)
      );
    }

    // Filter by status (pending, approved, rejected)
    if (this.filterOption !== 'all') {
      filteredRequests = filteredRequests.filter(req =>
        req.requestStatus.toLowerCase() === this.filterOption
      );
    }

    this.requests = filteredRequests; // Update displayed requests
    this.error = null; // Clear previous filter errors
    if (this.requests.length === 0 && (this.searchQuery.trim() || this.filterOption !== 'all')) {
      this.error = 'No requests found matching your criteria.';
    } else if (this.requests.length === 0) {
      this.error = 'No property requests found for your account.';
    }
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  /**
   * Opens the Property Details modal.
   * @param propertyId The ID of the property to view.
   */
  openPropertyDetailsModal(propertyId: number | undefined): void {
    if (propertyId === undefined || propertyId === null) {
      this.propertyDetailsError = 'Property ID is missing. Cannot fetch details.';
      return;
    }

    this.propertyDetailsLoading = true;
    this.propertyDetailsError = null;
    this.selectedProperty = null;

    this.propertyUpdateService.fetchPropertyById(propertyId).pipe(
      catchError(err => {
        this.propertyDetailsError = `Failed to fetch property details: ${err.message || err.error || 'An error occurred.'}`;
        console.error('Error fetching property details:', err);
        this.propertyDetailsLoading = false;
        return EMPTY;
      })
    ).subscribe({
      next: (propertyData: Property) => {
        this.selectedProperty = propertyData;
        this.showPropertyDetailsModal = true;
        this.propertyDetailsLoading = false;
      },
      complete: () => {
        this.propertyDetailsLoading = false;
      }
    });
  }

  closePropertyDetailsModal(): void {
    this.showPropertyDetailsModal = false;
    this.selectedProperty = null;
    this.propertyDetailsError = null;
  }

  /**
   * Opens the Tenant Details modal.
   * @param tenantId The ID of the tenant to view.
   */
  openTenantDetailsModal(tenantId: number): void {
    if (tenantId === undefined || tenantId === null) {
      this.tenantDetailsError = 'Tenant ID is missing. Cannot fetch details.';
      return;
    }

    this.tenantDetailsLoading = true;
    this.tenantDetailsError = null;
    this.selectedTenant = null;

    this.tenantUpdateService.getTenantDetailsById(tenantId).pipe(
      catchError(err => {
        this.tenantDetailsError = `Failed to fetch tenant details: ${err.message || err.error || 'An error occurred.'}`;
        console.error('Error fetching tenant details:', err);
        this.tenantDetailsLoading = false;
        return EMPTY;
      })
    ).subscribe({
      next: (tenantData: Tenant) => {
        this.selectedTenant = tenantData;
        this.showTenantDetailsModal = true;
        this.tenantDetailsLoading = false;
      },
      complete: () => {
        this.tenantDetailsLoading = false;
      }
    });
  }

  closeTenantDetailsModal(): void {
    this.showTenantDetailsModal = false;
    this.selectedTenant = null;
    this.tenantDetailsError = null;
  }

  /**
   * Opens the Update Request Status modal.
   * @param request The request object to update.
   */
  openUpdateRequestModal(request: AppRequest): void { // Use AppRequest here
    this.requestToUpdate = { ...request }; // Create a copy to avoid directly modifying displayed data
    this.newRequestStatus = request.requestStatus; // Pre-fill dropdown with current status
    this.updateRequestError = null;
    this.showUpdateRequestModal = true;
  }

  /**
   * Confirms and sends the request status update.
   */
  confirmUpdateRequest(): void {
    if (!this.requestToUpdate || !this.newRequestStatus) {
      this.updateRequestError = 'Please select a status.';
      return;
    }

    if (this.requestToUpdate.requestStatus === this.newRequestStatus) {
      this.updateRequestError = 'Status is already set to the selected value.';
      return;
    }

    this.loading = true;
    this.updateRequestError = null;

    const updatedRequestPayload: AppRequest = { // Corrected: Used 'AppRequest'
      requestId: this.requestToUpdate.requestId,
      tenantId: this.requestToUpdate.tenantId,
      ownerId: this.requestToUpdate.ownerId,
      propertyId: this.requestToUpdate.propertyId,
      requestStatus: this.newRequestStatus
    };

    this.propertyRequestService.updateRequestStatus(updatedRequestPayload).subscribe({
      next: (response) => {
        this.displayMessage('Request status updated successfully!', 'success');
        console.log('Request update response:', response);
        this.closeUpdateRequestModal();
        this.loadOwnerIdAndRequests(); // Reload data to reflect changes
      },
      error: (err) => {
        this.updateRequestError = `Failed to update request status: ${err.message || err.error || 'An error occurred.'}`;
        this.displayMessage(this.updateRequestError, 'danger');
        console.error('Error updating request status:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  closeUpdateRequestModal(): void {
    this.showUpdateRequestModal = false;
    this.requestToUpdate = null;
    this.newRequestStatus = '';
    this.updateRequestError = null;
  }

  /**
   * Opens the delete request confirmation modal.
   * @param request The request to delete.
   */
  openDeleteRequestConfirmModal(request: RequestDisplayItem): void {
    if (request.requestId === undefined || request.requestId === null) {
      this.displayMessage('Error: Request ID is missing. Cannot delete request.', 'danger');
      return;
    }
    this.requestToDeleteId = request.requestId;
    this.requestToDeleteSummary = `request for property "${request.propertyName}" by tenant ${request.tenantName}`;
    this.showDeleteRequestConfirmModal = true;
  }

  /**
   * Confirms and sends the request deletion.
   */
  confirmDeleteRequest(): void {
    if (this.requestToDeleteId === null) {
      this.displayMessage('Error: No request selected for deletion.', 'danger');
      return;
    }

    this.loading = true;
    this.propertyRequestService.deleteRequest(this.requestToDeleteId).subscribe({
      next: () => {
        this.displayMessage('Request deleted successfully!', 'success');
        this.closeDeleteRequestConfirmModal();
        this.loadOwnerIdAndRequests(); // Reload requests to update the list
      },
      error: (err) => {
        this.displayMessage(`Failed to delete request: ${err.message || err.error || 'An error occurred.'}`, 'danger');
        console.error('Error deleting request:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  closeDeleteRequestConfirmModal(): void {
    this.showDeleteRequestConfirmModal = false;
    this.requestToDeleteId = null;
    this.requestToDeleteSummary = '';
  }

  /**
   * Helper to display messages (success/error)
   * @param message The message to display.
   * @param type 'success' or 'danger'.
   */
  private displayMessage(message: string, type: 'success' | 'danger'): void {
    if (type === 'success') {
      this.successMessage = message;
      this.error = null;
    } else {
      this.error = message;
      this.successMessage = null;
    }
    setTimeout(() => {
      this.successMessage = null;
      this.error = null;
    }, 5000);
  }

  getImageSrc(imagePath: string | undefined): string {
    return imagePath && imagePath.trim() !== '' ? imagePath : 'https://placehold.co/300x200/cccccc/333333?text=No+Image';
  }
}