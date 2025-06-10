// src/app/owner-property-management/owner-property-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router'; // Keep RouterLink if used in HTML
import { HttpClientModule } from '@angular/common/http';
import { Property } from '../registerservice.service'; // Adjust path if needed
import { Observable, EMPTY, of, forkJoin } from 'rxjs'; // Import forkJoin
import { PropertyUpdateService } from '../property-update.service'; // Corrected: Use PropertyUpdateService
import { AuthService } from '../auth.service';
import { OwnerUpdateService } from '../owner-update.service'; // Import OwnerUpdateService
import { switchMap, catchError, tap, map } from 'rxjs/operators';

@Component({
  selector: 'owner-property', // Consider renaming to 'app-owner-property-management' for convention
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HttpClientModule],
  templateUrl: './owner-property-management.component.html',
  styleUrls: ['./owner-property-management.component.css']
})
export class OwnerPropertyComponent implements OnInit { // Class name matches commented out code
  properties: Property[] = [];
  searchQuery: string = '';
  filterOption: 'all' | 'address' | 'rent' | 'status' = 'all'; // Added 'status' filter
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;
  currentOwnerId: number | null = null; // Store ownerId once fetched

  constructor(
    private propertyUpdateService: PropertyUpdateService, // Corrected: Injected PropertyUpdateService
    private authService: AuthService,
    private ownerUpdateService: OwnerUpdateService, // Used to get ownerId by name
    private router: Router // Inject Router for potential redirects
  ) { }

  ngOnInit(): void {
    this.loadOwnerIdAndProperties();
  }

  /**
   * Loads the current owner's ID and then fetches all properties owned by them.
   */
  loadOwnerIdAndProperties(): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;
    this.properties = []; // Clear properties before loading

    const ownerName = this.authService.getUsernameFromToken();
    console.log('OwnerPropertyComponent: Loading properties for owner name:', ownerName);

    if (!ownerName) {
      this.error = 'You are not logged in as an Owner. Please log in again.';
      console.error('OwnerPropertyComponent: No owner name found from token. Redirecting to login.');
      // Using alert() as per user's previous code, consider a modal/toast for better UX.
      alert(this.error);
      this.router.navigate(['/login']);
      this.loading = false;
      return;
    }

    // First, get ownerId by name, then use it to fetch ALL properties and filter them
    this.ownerUpdateService.getOwnerIdByName(ownerName).pipe(
      tap(ownerId => console.log('OwnerPropertyComponent: Fetched owner ID:', ownerId)),
      switchMap((ownerId: number) => { // Explicitly type ownerId as number
        if (ownerId === null || ownerId === undefined || isNaN(ownerId) || ownerId <= 0) { // Added isNaN check
          throw new Error('Could not retrieve a valid Owner ID for the current user.');
        }
        this.currentOwnerId = ownerId; // Store for later use

        // Fetch all properties, then filter by the current owner's ID
        return this.propertyUpdateService.fetchAllProperties().pipe(
          map((allProperties: Property[]) => { // Explicitly type allProperties as Property[]
            return allProperties.filter(p => p.ownerId === this.currentOwnerId);
          })
        );
      }),
      catchError(err => {
        this.error = `Failed to load owner's properties: ${err.message || 'An error occurred.'}`;
        console.error('OwnerPropertyComponent: Error in chained fetch for properties:', err);
        alert(this.error);
        this.router.navigate(['/owner-home']); // Redirect back to owner home or login on error
        this.loading = false;
        return EMPTY; // Stop the observable chain
      })
    ).subscribe({
      next: (data: Property[]) => { // Explicitly type data as Property[]
        this.properties = data;
        this.loading = false;
        if (this.properties.length === 0) {
          this.error = 'No properties found for your account.';
        }
        // Apply filter initially or re-apply after loading
        this.applyFilter();
      },
      error: () => { // Error already handled in catchError pipe, but kept for clarity
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  /**
   * Applies search and filter criteria to the properties list.
   * This logic now filters properties on the client-side after initial fetch.
   */
  applyFilter(): void {
    let filtered = [...this.properties]; // Start with all properties

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.trim().toLowerCase();
      
      filtered = filtered.filter(p => {
        if (this.filterOption === 'address') {
          return p.address.toLowerCase().includes(query);
        } else if (this.filterOption === 'rent') {
          const rentParts = query.split('/');
          if (rentParts.length === 2 && !isNaN(Number(rentParts[0])) && !isNaN(Number(rentParts[1]))) {
            const minRent = Number(rentParts[0]);
            const maxRent = Number(rentParts[1]);
            return p.rentAmount >= minRent && p.rentAmount <= maxRent;
          }
          return false; // Invalid rent format
        } else if (this.filterOption === 'status') {
          return p.availabilityStatus.toLowerCase() === query; // Exact match for status
        } else { // 'all' filter or general search (by property name, address, details, status)
          return p.propertyName.toLowerCase().includes(query) ||
                 p.address.toLowerCase().includes(query) ||
                 p.propertyDetails.toLowerCase().includes(query) ||
                 p.availabilityStatus.toLowerCase().includes(query);
        }
      });
    }

    this.properties = filtered; // Update properties array with filtered results
    
    // Manage error message for empty results
    if (this.properties.length === 0 && (this.searchQuery.trim() || this.filterOption !== 'all')) {
        this.error = 'No properties found matching your search criteria.';
    } else if (this.properties.length === 0 && !this.searchQuery.trim() && this.filterOption === 'all') {
        this.error = 'No properties found for your account.';
    } else {
        this.error = null; // Clear error if results are found
    }
  }

  onSearch(): void {
    this.applyFilter(); // Apply filter based on current search query
  }

  onFilterChange(): void {
    // Clear search query if 'all' is selected to prevent confusion
    if (this.filterOption === 'all') {
      this.searchQuery = '';
    }
    this.applyFilter(); // Re-apply filter based on new option
  }

  /**
   * Handles deleting a property after user confirmation.
   * @param propertyId The ID of the property to delete.
   */
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
          this.loadOwnerIdAndProperties(); // Re-load properties after deletion
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

  /**
   * Provides a fallback image source if the given image path is empty or invalid.
   * @param imagePath The path to the property image.
   * @returns The image path or a placeholder URL.
   */
  getImageSrc(imagePath: string | undefined): string {
    return imagePath && imagePath.trim() !== '' ? imagePath : 'https://placehold.co/300x200/cccccc/333333?text=No+Image';
  }
}