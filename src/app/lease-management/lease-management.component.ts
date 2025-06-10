// src/app/lease-management/lease-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { Lease, Property, Owner, Tenant } from '../registerservice.service';
import { LeaseService } from '../lease.service';
import { AuthService, UserRole } from '../auth.service'; // Assuming AuthService provides role and username
import { OwnerUpdateService } from '../owner-update.service'; // For owner details and ID by name
import { TenantUpdateService } from '../tenant-update.service'; // For tenant details and ID by name
import { PropertyUpdateService } from '../property-update.service'; // For property details
import { forkJoin, EMPTY, Observable, of } from 'rxjs';
import { catchError, switchMap, map, tap } from 'rxjs/operators';
import { DatePipe } from '@angular/common'; // For date formatting in display
import { OwnersService } from '../owners.service'; 
// --- Interfaces for Display (enriched data) ---
interface LeaseDisplayItem extends Lease {
  propertyName: string;
  propertyAddress: string;
  propertyImage: string;
  ownerName: string;
  tenantName: string;
}

// --- Modals related interfaces ---
interface ModalState {
  show: boolean;
  data: any | null;
  loading: boolean;
  error: string | null;
}

@Component({
  selector: 'lease-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule, DatePipe], // Add DatePipe here
  templateUrl: './lease-management.component.html',
  styleUrls: ['./lease-management.component.css']
})
export class LeaseManagementComponent implements OnInit {
  userRole: UserRole | null = null;
  currentUserId: number | null = null; // Will store tenantId or ownerId
  userName: string | null = null;

  leases: LeaseDisplayItem[] = [];
  filteredLeases: LeaseDisplayItem[] = [];

  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Filters
  searchQuery: string = '';
  filterStatus: 'ALL' | 'ACTIVE' | 'EXTENDED' | 'TERMINATED' = 'ALL';

  // --- Modals State ---
  ownerDetailsModal: ModalState = { show: false, data: null, loading: false, error: null };
  tenantDetailsModal: ModalState = { show: false, data: null, loading: false, error: null };
  propertyDetailsModal: ModalState = { show: false, data: null, loading: false, error: null };
  confirmDeleteModal: ModalState = { show: false, data: null, loading: false, error: null };

  // Caches for enriching data (to avoid repeated API calls)
  private propertiesCache = new Map<number, Property>();
  private ownersCache = new Map<number, Owner>();
  private tenantsCache = new Map<number, Tenant>();

  constructor(
    private leaseService: LeaseService,
    private authService: AuthService,
    private ownerService: OwnerUpdateService,
    private tenantService: TenantUpdateService,
    private propertyService: PropertyUpdateService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.checkUserRoleAndLoadLeases();
  }

  /**
   * Determines user role and fetches relevant leases.
   */
  checkUserRoleAndLoadLeases(): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;
    this.leases = [];
    this.filteredLeases = [];

    const token = this.authService.getToken();
    if (!token) {
      this.displayMessage('You are not logged in. Redirecting to login.', 'danger');
      setTimeout(() => this.router.navigate(['/login']), 2000);
      this.loading = false;
      return;
    }

    this.userRole = this.authService.getRoleFromToken();
    this.userName = this.authService.getUsernameFromToken();

    if (!this.userRole || !this.userName) {
      this.displayMessage('Unable to retrieve user role or username. Redirecting to login.', 'danger');
      setTimeout(() => this.router.navigate(['/login']), 2000);
      this.loading = false;
      return;
    }

    console.log(`LeaseManagement: User Role: ${this.userRole}, Username: ${this.userName}`);

    // Fetch all necessary supporting data (properties, owners, tenants) once
    forkJoin([
      this.propertyService.fetchAllProperties().pipe(
        tap(props => props.forEach(p => this.propertiesCache.set(p.propertyId!, p))),
        catchError(err => { console.warn('Failed to fetch all properties:', err); return of([]); })
      ),
      this.ownerService.getAllOwners().pipe( // Using getAllOwners from OwnersService (admin-level)
        tap(owners => owners.forEach(o => this.ownersCache.set(o.ownerId!, o))),
        catchError(err => { console.warn('Failed to fetch all owners:', err); return of([]); })
      ),
      this.tenantService.getAllTenants().pipe( // Using getAllTenants method from TenantUpdateService
        tap(tenants => tenants.forEach(t => this.tenantsCache.set(t.tenantId!, t))),
        catchError(err => { console.warn('Failed to fetch all tenants:', err); return of([]); })
      )
    ]).pipe(
      switchMap(() => this.fetchLeasesBasedOnRole()), // Then fetch leases based on role
      catchError(err => {
        this.error = `Critical error loading supporting data or leases: ${err.message || 'An error occurred.'}`;
        console.error('LeaseManagement: Critical data load error:', err);
        this.displayMessage(this.error, 'danger');
        this.loading = false;
        return EMPTY;
      })
    ).subscribe({
      next: (leases: Lease[]) => {
        this.leases = this.enrichLeaseData(leases);
        this.applyFilters(); // Apply initial filters
        this.loading = false;
        if (this.leases.length === 0) {
          this.error = 'No leases found for your account.';
        }
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  /**
   * Fetches leases based on the determined user role.
   */
  private fetchLeasesBasedOnRole(): Observable<Lease[]> {
    switch (this.userRole) {
      case 'ADMIN':
        return this.leaseService.getAllLeases();
      case 'TENANT':
        return this.tenantService.getTenantIdByUsername(this.userName!).pipe(
          switchMap((tenantId: number) => {
            if (!tenantId || tenantId <= 0) throw new Error('Tenant ID not found for current user.');
            this.currentUserId = tenantId;
            return this.leaseService.getLeasesByTenantId(tenantId);
          }),
          catchError(err => {
            console.error('Failed to get tenant ID or leases for tenant:', err);
            return of([]); // Return empty array if tenant ID or leases fail
          })
        );
      case 'OWNER':
        return this.ownerService.getOwnerIdByName(this.userName!).pipe(
          switchMap((ownerId: number) => {
            if (!ownerId || ownerId <= 0) throw new Error('Owner ID not found for current user.');
            this.currentUserId = ownerId;
            return this.leaseService.getLeasesByOwnerId(ownerId);
          }),
          catchError(err => {
            console.error('Failed to get owner ID or leases for owner:', err);
            return of([]); // Return empty array if owner ID or leases fail
          })
        );
      default:
        this.displayMessage('Unknown user role. Access denied.', 'danger');
        setTimeout(() => this.router.navigate(['/login']), 2000);
        return EMPTY;
    }
  }

  /**
   * Enriches raw Lease objects with Property, Owner, and Tenant names for display.
   */
  private enrichLeaseData(leases: Lease[]): LeaseDisplayItem[] {
    return leases.map(lease => {
      const property = this.propertiesCache.get(lease.propertyId);
      const owner = this.ownersCache.get(lease.ownerId);
      const tenant = this.tenantsCache.get(lease.tenantId);

      return {
        ...lease,
        propertyName: property?.propertyName || 'N/A',
        propertyAddress: property?.address || 'N/A',
        propertyImage: property?.image || '',
        ownerName: owner?.name || 'N/A',
        tenantName: tenant?.name || 'N/A'
      };
    });
  }

  /**
   * Applies search and filter criteria to the leases.
   */
  applyFilters(): void {
    let filtered = [...this.leases]; // Start with the raw fetched leases (before current filtering)

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.trim().toLowerCase();
      filtered = filtered.filter(lease =>
        lease.propertyName.toLowerCase().includes(query) ||
        lease.propertyAddress.toLowerCase().includes(query) ||
        lease.ownerName.toLowerCase().includes(query) ||
        lease.tenantName.toLowerCase().includes(query) ||
        lease.agreementDetails.toLowerCase().includes(query) ||
        String(lease.leaseId).includes(query) ||
        String(lease.rentAmount).includes(query) ||
        String(lease.period).includes(query) // Include period in search
      );
    }

    // Filter by status
    if (this.filterStatus !== 'ALL') {
      filtered = filtered.filter(lease => lease.leaseStatus === this.filterStatus);
    }

    this.filteredLeases = filtered; // Update the displayed list

    // Handle no results
    if (this.filteredLeases.length === 0 && (this.searchQuery.trim() || this.filterStatus !== 'ALL')) {
      this.error = 'No leases found matching your criteria.';
    } else if (this.leases.length > 0 && this.filteredLeases.length === 0) {
      this.error = 'No leases found matching your criteria.';
    } else if (this.leases.length === 0) {
      this.error = 'No leases found for your account.';
    } else {
      this.error = null; // Clear error if results are found
    }
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterStatusChange(): void {
    this.applyFilters();
  }

  // --- Modal Operations ---

  openOwnerDetailsModal(ownerId: number): void {
    this.ownerDetailsModal = { show: true, data: null, loading: true, error: null };
    this.ownerService.getOwnerById(ownerId).pipe(
      catchError(err => {
        this.ownerDetailsModal.error = `Failed to load owner details: ${err.message || 'Error'}`;
        console.error('Error fetching owner details:', err);
        this.ownerDetailsModal.loading = false;
        return EMPTY;
      })
    ).subscribe(owner => {
      this.ownerDetailsModal.data = owner;
      this.ownerDetailsModal.loading = false;
    });
  }

  closeOwnerDetailsModal(): void {
    this.ownerDetailsModal = { show: false, data: null, loading: false, error: null };
  }

  openTenantDetailsModal(tenantId: number): void {
    this.tenantDetailsModal = { show: true, data: null, loading: true, error: null };
    this.tenantService.getTenantDetailsById(tenantId).pipe( // Assuming getTenantDetailsById in TenantUpdateService
      catchError(err => {
        this.tenantDetailsModal.error = `Failed to load tenant details: ${err.message || 'Error'}`;
        console.error('Error fetching tenant details:', err);
        this.tenantDetailsModal.loading = false;
        return EMPTY;
      })
    ).subscribe(tenant => {
      this.tenantDetailsModal.data = tenant;
      this.tenantDetailsModal.loading = false;
    });
  }

  closeTenantDetailsModal(): void {
    this.tenantDetailsModal = { show: false, data: null, loading: false, error: null };
  }

  openPropertyDetailsModal(propertyId: number): void {
    this.propertyDetailsModal = { show: true, data: null, loading: true, error: null };
    this.propertyService.fetchPropertyById(propertyId).pipe( // Assuming fetchPropertyById in PropertyUpdateService
      catchError(err => {
        this.propertyDetailsModal.error = `Failed to load property details: ${err.message || 'Error'}`;
        console.error('Error fetching property details:', err);
        this.propertyDetailsModal.loading = false;
        return EMPTY;
      })
    ).subscribe(property => {
      this.propertyDetailsModal.data = property;
      this.propertyDetailsModal.loading = false;
    });
  }

  closePropertyDetailsModal(): void {
    this.propertyDetailsModal = { show: false, data: null, loading: false, error: null };
  }

  openDeleteConfirmModal(leaseId: number, leaseSummary: string): void {
    this.confirmDeleteModal = { show: true, data: { leaseId, leaseSummary }, loading: false, error: null };
  }

  confirmDeleteLease(): void {
    if (!this.confirmDeleteModal.data || !this.confirmDeleteModal.data.leaseId) {
      this.confirmDeleteModal.error = 'Lease ID not found for deletion.';
      return;
    }

    this.confirmDeleteModal.loading = true;
    this.confirmDeleteModal.error = null;

    this.leaseService.deleteLease(this.confirmDeleteModal.data.leaseId).subscribe({
      next: (response) => {
        this.displayMessage('Lease deleted successfully!', 'success');
        this.closeDeleteConfirmModal();
        this.checkUserRoleAndLoadLeases(); // Reload leases after deletion
      },
      error: (err) => {
        this.confirmDeleteModal.error = `Failed to delete lease: ${err.message || 'An error occurred.'}`;
        this.displayMessage(this.confirmDeleteModal.error, 'danger');
        console.error('Error deleting lease:', err);
        this.confirmDeleteModal.loading = false;
      },
      complete: () => {
        this.confirmDeleteModal.loading = false;
      }
    });
  }

  closeDeleteConfirmModal(): void {
    this.confirmDeleteModal = { show: false, data: null, loading: false, error: null };
  }

  // --- Navigation/Actions ---
  onAddLease(): void {
    this.router.navigate(['/lease-create']);
  }

  onEditLease(leaseId: number): void {
    this.router.navigate(['/lease-update', leaseId]);
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
