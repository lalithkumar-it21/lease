// src/app/admin-dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Property, Tenant, Owner } from './registerservice.service'; // Assuming these interfaces are here
import { Lease } from './registerservice.service'; // Assuming Lease interface is here

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private baseUrl = 'http://localhost:9092'; // Base URL for all specified microservices

  constructor(private http: HttpClient) { }

  /**
   * Fetches all properties and returns their count.
   * @returns An Observable of the total number of properties.
   */
  getTotalProperties(): Observable<number> {
    return this.http.get<Property[]>(`${this.baseUrl}/property/fetchAll`).pipe(
      map(properties => properties.length),
      catchError(this.handleError)
    );
  }

  /**
   * Fetches all leases and returns their count.
   * @returns An Observable of the total number of leases.
   */
  getTotalLeases(): Observable<number> {
    return this.http.get<Lease[]>(`${this.baseUrl}/lease/fetchAll`).pipe(
      map(leases => leases.length),
      catchError(this.handleError)
    );
  }

  /**
   * Fetches all owners and returns their count.
   * @returns An Observable of the total number of owners.
   */
  getTotalOwners(): Observable<number> {
    return this.http.get<Owner[]>(`${this.baseUrl}/owner/fetchAll`).pipe(
      map(owners => owners.length),
      catchError(this.handleError)
    );
  }

  /**
   * Fetches all tenants and returns their count.
   * @returns An Observable of the total number of tenants.
   */
  getTotalTenants(): Observable<number> {
    return this.http.get<Tenant[]>(`${this.baseUrl}/tenant/fetchAll`).pipe(
      map(tenants => tenants.length),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred in AdminDashboardService!';
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
    console.error('AdminDashboardService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
