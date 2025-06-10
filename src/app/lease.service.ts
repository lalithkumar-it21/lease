// src/app/lease.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Lease } from './registerservice.service'; // Import the Lease interface

// Define payload for creating a new lease (without leaseId)
export type LeaseCreatePayload = Omit<Lease, 'leaseId'>;

// Define payload for updating a lease (only editable fields)
// Note: leaseId, propertyId, tenantId, ownerId are NOT part of the payload,
// as they are immutable or passed as path variables.
export interface LeaseUpdatePayload {
  period: number;
  startDate: string;
  endDate: string;
  agreementDetails: string;
  rentAmount: number;
  leaseStatus: 'ACTIVE' | 'EXTENDED' | 'TERMINATED';
}

@Injectable({
  providedIn: 'root'
})
export class LeaseService {
  private baseUrl = 'http://localhost:9092/lease'; // Base URL for lease microservice

  constructor(private http: HttpClient) { }

  /**
   * Fetches all lease details (for Admin).
   * Corresponds to GET http://localhost:9092/lease/fetchAll
   * @returns An Observable of an array of Lease objects.
   */
  getAllLeases(): Observable<Lease[]> {
    console.log('LeaseService: Fetching all leases...');
    return this.http.get<Lease[]>(`${this.baseUrl}/fetchAll`).pipe(
      tap(leases => console.log('LeaseService: Fetched all leases:', leases)),
      catchError(this.handleError)
    );
  }

  /**
   * Fetches leases by tenant ID.
   * Corresponds to GET http://localhost:9092/lease/leaseByTenant/{tenantId}
   * @param tenantId The ID of the tenant.
   * @returns An Observable of an array of Lease objects.
   */
  getLeasesByTenantId(tenantId: number): Observable<Lease[]> {
    console.log(`LeaseService: Fetching leases for tenant ID: ${tenantId}`);
    return this.http.get<Lease[]>(`${this.baseUrl}/leaseByTenant/${tenantId}`).pipe(
      tap(leases => console.log('LeaseService: Fetched tenant leases:', leases)),
      catchError(this.handleError)
    );
  }

  /**
   * Fetches leases by owner ID.
   * Corresponds to GET http://localhost:9092/lease/leaseByOwner/{ownerId}
   * @param ownerId The ID of the owner.
   * @returns An Observable of an array of Lease objects.
   */
  getLeasesByOwnerId(ownerId: number): Observable<Lease[]> {
    console.log(`LeaseService: Fetching leases for owner ID: ${ownerId}`);
    return this.http.get<Lease[]>(`${this.baseUrl}/leaseByOwner/${ownerId}`).pipe(
      tap(leases => console.log('LeaseService: Fetched owner leases:', leases)),
      catchError(this.handleError)
    );
  }

  /**
   * Fetches a single lease by its ID.
   * Corresponds to GET http://localhost:9092/lease/fetchById/{leaseId}
   * @param leaseId The ID of the lease to fetch.
   * @returns An Observable of a single Lease object.
   */
  getLeaseById(leaseId: number): Observable<Lease> {
    console.log(`LeaseService: Fetching lease with ID: ${leaseId}`);
    return this.http.get<Lease>(`${this.baseUrl}/fetchById/${leaseId}`).pipe(
      tap(lease => console.log('LeaseService: Fetched lease by ID:', lease)),
      catchError(this.handleError)
    );
  }

  /**
   * Creates a new lease.
   * Corresponds to POST http://localhost:9092/lease/save
   * @param lease The Lease object to create (without leaseId, as it's auto-generated).
   * @returns An Observable of a string response (e.g., success message).
   */
  createLease(lease: LeaseCreatePayload): Observable<string> {
    console.log('LeaseService: Creating new lease:', lease);
    return this.http.post(`${this.baseUrl}/save`, lease, { responseType: 'text' }).pipe(
      tap(response => console.log('LeaseService: Lease creation successful:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Updates an existing lease.
   * Corresponds to PUT http://localhost:9092/lease/update/{leaseId}
   * @param leaseId The ID of the lease to update.
   * @param payload The updated lease data.
   * @returns An Observable of the updated Lease object (backend response).
   */
  updateLease(leaseId: number, payload: LeaseUpdatePayload): Observable<Lease> {
    console.log(`LeaseService: Updating lease ID: ${leaseId} with payload:`, payload);
    return this.http.put<Lease>(`${this.baseUrl}/update/${leaseId}`, payload).pipe(
      tap(response => console.log('LeaseService: Lease updated successfully:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Deletes a lease by its ID.
   * Corresponds to DELETE http://localhost:9092/lease/delete/{leaseId}
   * @param leaseId The ID of the lease to delete.
   * @returns An Observable of a string response (e.g., success message).
   */
  deleteLease(leaseId: number): Observable<string> {
    console.log(`LeaseService: Deleting lease with ID: ${leaseId}`);
    return this.http.delete(`${this.baseUrl}/delete/${leaseId}`, { responseType: 'text' }).pipe(
      tap(response => console.log('LeaseService: Lease deletion successful:', response)),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client/Network Error: ${error.error.message}`;
    } else {
      console.error(`Backend returned code ${error.status}, body:`, error.error);
      errorMessage = `Server Error (${error.status}): ${error.statusText || 'Unknown'}`;
      if (typeof error.error === 'string') {
        errorMessage += `\nDetails: ${error.error}`;
      } else if (error.error && typeof error.error === 'object' && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error) {
        errorMessage += `\nDetails: ${JSON.stringify(error.error)}`;
      }
    }
    console.error('LeaseService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
