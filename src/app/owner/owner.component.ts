import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { Owner } from '../registerservice.service'; // Import the Owner interface
import { OwnersService } from '../owners.service'; // Import the new OwnerService
import { catchError, map, tap } from 'rxjs/operators';
import { of } from 'rxjs'; // Import 'of'

@Component({
  selector: 'owners', // Updated selector name
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HttpClientModule],
  templateUrl: './owner.component.html',
  styleUrls: ['./owner.component.css']
})
export class OwnerComponent implements OnInit {
  owners: Owner[] = [];
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;
  searchQuery: string = '';
  filterOption: 'all' | 'name' | 'email' | 'contact' | 'address' = 'all';

  constructor(
    private ownersService: OwnersService, // Inject the OwnerService
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadOwners();
  }

  loadOwners(): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    this.ownersService.getAllOwners().pipe(
      tap(data => console.log('Fetched owners:', data)),
      catchError(err => {
        this.error = `Failed to load owners: ${err.message || 'An error occurred.'}`;
        console.error('Error loading owners:', err);
        this.loading = false;
        return of([]); // Return an empty array to prevent error propagation
      })
    ).subscribe({
      next: (data) => {
        this.owners = data;
        this.loading = false;
        if (this.owners.length === 0) {
          this.error = 'No owners found.';
        }
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    // Implement client-side filtering based on searchQuery and filterOption
    // For simplicity, we'll re-fetch all and then filter.
    // For large datasets, you might want to send search queries to the backend.
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    this.ownersService.getAllOwners().pipe(
      map(allOwners => {
        const query = this.searchQuery.trim().toLowerCase();
        if (!query || this.filterOption === 'all') {
          return allOwners;
        }

        return allOwners.filter(owner => {
          switch (this.filterOption) {
            case 'name':
              return owner.name.toLowerCase().includes(query);
            case 'email':
              return owner.email.toLowerCase().includes(query);
            case 'contact':
              return owner.contact.toLowerCase().includes(query);
            case 'address':
              return owner.address.toLowerCase().includes(query);
            default:
              return true;
          }
        });
      }),
      catchError(err => {
        this.error = `Failed to filter owners: ${err.message || 'An error occurred.'}`;
        console.error('Error filtering owners:', err);
        this.loading = false;
        return of([]);
      })
    ).subscribe({
      next: (filteredOwners) => {
        this.owners = filteredOwners;
        this.loading = false;
        if (this.owners.length === 0 && this.searchQuery) {
          this.error = 'No owners found matching your search criteria.';
        }
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    // Clear search query if 'all' is selected
    if (this.filterOption === 'all') {
      this.searchQuery = '';
    }
    this.onSearch(); // Re-apply filters
  }


  onEditOwner(ownerId: number | undefined): void {
    if (ownerId === undefined || ownerId === null) {
      alert('Error: Owner ID is missing. Cannot edit.');
      return;
    }
    console.log('Navigating to edit owner:', ownerId);
    this.router.navigate(['/admin-owner-update', ownerId]); // Navigate to a new update component
  }

  onDeleteOwner(ownerId: number | undefined): void {
    if (ownerId === undefined || ownerId === null) {
      alert('Error: Owner ID is missing. Cannot delete.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this owner and all their properties? This action cannot be undone!')) {
      this.loading = true;
      this.error = null;
      this.successMessage = null;

      this.ownersService.deleteOwner(ownerId).subscribe({
        next: (response) => {
          this.successMessage = 'Owner and associated properties deleted successfully!';
          console.log('Owner delete response:', response);
          this.loadOwners(); // Reload the list after deletion
        },
        error: (err) => {
          this.error = `Failed to delete owner: ${err.message || err.error || 'An error occurred.'}`;
          console.error('Error deleting owner:', err);
          alert(this.error);
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }
}