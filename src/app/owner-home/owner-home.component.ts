// src/app/owner-dashboard/owner-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { OwnerDashboardService } from '../owner-dashboard.service';
import { AuthService } from '../auth.service';
import { OwnerUpdateService } from '../owner-update.service';
import { forkJoin, of, EMPTY, Observable } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators'; // Make sure 'tap' is imported
import { CommonModule } from '@angular/common';

@Component({
  selector: 'owner-home',
  standalone: true,
  imports: [
    RouterLink,
    RouterOutlet,
    HttpClientModule,
    CommonModule
  ],
  templateUrl: './owner-home.component.html',
  styleUrl: './owner-home.component.css'
})
export class OwnerDashboardComponent implements OnInit {
  totalProperties: number | string = '...';
  activeLeases: number | string = '...';
  pendingRequests: number | string = '...';

  loadingCounts: boolean = true;
  errorMessage: string | null = null;
  currentOwnerId: number | null = null;

  constructor(
    private ownerDashboardService: OwnerDashboardService,
    private authService: AuthService,
    private ownerUpdateService: OwnerUpdateService
  ) { }

  ngOnInit(): void {
    if (!this.authService.isOwner()) {
      this.errorMessage = 'Access Denied: Only owners can view this dashboard.';
      this.loadingCounts = false;
      return;
    }
    this.getOwnerIdAndFetchDashboardCounts();
  }

  getOwnerIdAndFetchDashboardCounts(): void {
    this.loadingCounts = true;
    this.errorMessage = null;

    const username = this.authService.getUsernameFromToken();
    if (!username) {
      this.errorMessage = 'Owner username not found. Please log in again.';
      this.loadingCounts = false;
      return;
    }

    // Assuming ownerUpdateService.getOwnerByUsername returns the Owner object,
    // but if it returns just the ownerId (number), this change is crucial.
    // Let's explicitly cast or ensure type to avoid TS issues.
    this.ownerUpdateService.getOwnerIdByName(username).pipe(
      switchMap((ownerData: any) => { // Use 'any' or define a specific interface for what getOwnerByUsername returns
                                      // If it returns a full Owner object, define 'ownerData: Owner'
                                      // If it returns just the ID, it should be 'ownerId: number' directly
        let idToUse: number | null = null;

        // Determine if ownerData is an object with ownerId or just the ownerId number
        if (typeof ownerData === 'number') {
          idToUse = ownerData; // It's directly the ownerId
        } else if (ownerData && typeof ownerData === 'object' && ownerData.ownerId) {
          idToUse = ownerData.ownerId; // It's an object containing ownerId
        }

        if (idToUse !== null) {
          this.currentOwnerId = idToUse;
          console.log('Owner ID fetched:', this.currentOwnerId);
          return this.fetchDashboardCounts(this.currentOwnerId);
        } else {
          this.errorMessage = 'Could not retrieve owner ID or details. Please ensure your profile is complete or log in again.';
          this.loadingCounts = false;
          return EMPTY; // Stop the observable chain
        }
      }),
      catchError(err => {
        this.errorMessage = `Failed to get owner ID: ${err.message || 'An error occurred.'}`;
        this.loadingCounts = false;
        console.error('Error fetching owner ID for dashboard:', err);
        return EMPTY;
      })
    ).subscribe();
  }

  fetchDashboardCounts(ownerId: number): Observable<any> {
    // ... (rest of this method remains the same)
    return forkJoin({
        properties: this.ownerDashboardService.getTotalPropertiesByOwner(ownerId).pipe(
          catchError(err => {
            console.error('Error fetching total properties for owner:', err);
            return of('N/A');
          })
        ),
        activeLeases: this.ownerDashboardService.getActiveLeasesByOwner(ownerId).pipe(
          catchError(err => {
            console.error('Error fetching active leases for owner:', err);
            return of('N/A');
          })
        ),
        pendingRequests: this.ownerDashboardService.getPendingRequestsByOwner(ownerId).pipe(
          catchError(err => {
            console.error('Error fetching pending requests for owner:', err);
            return of('N/A');
          })
        )
      }).pipe(
        tap(results => {
          this.totalProperties = results.properties;
          this.activeLeases = results.activeLeases;
          this.pendingRequests = results.pendingRequests;
        }),
        catchError(err => {
          this.errorMessage = 'Failed to load some dashboard data. Check console for details.';
          this.loadingCounts = false;
          console.error('Overall dashboard data fetch error:', err);
          return EMPTY;
        })
      );
  }
}
