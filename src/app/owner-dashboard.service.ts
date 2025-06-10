// src/app/owner-dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Property, Request, Owner, Lease } from './registerservice.service'; // Reusing Property, Request, Owner interfaces
 // Assuming Lease interface is defined here

@Injectable({
  providedIn: 'root'
})
export class OwnerDashboardService {
  private baseUrl = 'http://localhost:9092'; // Base URL for your microservices

  constructor(private http: HttpClient) { }

  /**
   * Fetches properties owned by a specific owner and returns their count.
   * @param ownerId The ID of the owner.
   * @returns An Observable of the total number of properties for the owner.
   */
  getTotalPropertiesByOwner(ownerId: number): Observable<number> {
    return this.http.get<Property[]>(`${this.baseUrl}/property/propertiesByOwner/${ownerId}`).pipe(
      map(properties => properties.length),
      catchError(this.handleError)
    );
  }

  /**
   * Fetches all leases related to an owner (where owner is involved) and returns the count of 'ACTIVE' leases.
   * Note: Assuming 'leaseByTOwner' (tenant owner?) means leases where this owner is the owner.
   * @param ownerId The ID of the owner.
   * @returns An Observable of the count of active leases for the owner.
   */
  getActiveLeasesByOwner(ownerId: number): Observable<number> {
    return this.http.get<Lease[]>(`${this.baseUrl}/lease/leaseByOwner/${ownerId}`).pipe(
      map(leases => leases.filter(lease => lease.leaseStatus === 'ACTIVE').length),
      catchError(this.handleError)
    );
  }

  /**
   * Fetches all property requests related to an owner and returns the count of 'PENDING' requests.
   * @param ownerId The ID of the owner.
   * @returns An Observable of the count of pending requests for the owner.
   */
  getPendingRequestsByOwner(ownerId: number): Observable<number> {
    return this.http.get<Request[]>(`${this.baseUrl}/request/byOwner/${ownerId}`).pipe( // Changed to /request/byOwner as per previous discussions for requests
      map(requests => requests.filter(request => request.requestStatus === 'PENDING').length),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred in OwnerDashboardService!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      console.error(`Backend returned code ${error.status}, body was:`, error.error);
      errorMessage = `Server-side error (${error.status}): ${error.statusText || 'Unknown'}`;
      if (typeof error.error === 'string') {
        errorMessage += `\nDetails: ${error.error}`;
      } else if (error.error && typeof error.error === 'object' && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error) {
        errorMessage += `\nDetails: ${JSON.stringify(error.error)}`;
      }
    }
    console.error('OwnerDashboardService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
