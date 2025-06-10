// src/app/tenant-update.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Tenant } from './registerservice.service'; // Assuming Tenant interface is here

// Define the exact interface for the update payload as per your Postman body
export interface TenantUpdatePayload {
  name: string;
  email: string;
  contact: string;
  address: string;
}

@Injectable({
  providedIn: 'root'
})
export class TenantUpdateService {
  // Base URL for the Tenant Management microservice for fetching details by ID
  // Updated to use 8093 as per your latest explicit instruction for fetchById
  private tenantDetailsBaseUrl = 'http://localhost:9092/tenant'; 
  // Base URL for API Gateway for specific ID lookup by name and other tenant CRUD operations (if any)
  private apiGatewayBaseUrl = 'http://localhost:9092/tenant';

  constructor(private http: HttpClient) { }
  getAllTenants(): Observable<Tenant[]> {
    console.log('TenantUpdateService: Fetching all tenants...');
    return this.http.get<Tenant[]>(`${this.tenantDetailsBaseUrl}/fetchAll`).pipe(
      tap(tenants => console.log('TenantUpdateService: Fetched tenants:', tenants)),
      catchError(this.handleError)
    );
  }
  /**
   * Fetches ONLY the tenant ID by their username (name) via the API Gateway.
   * This endpoint (e.g., /id-by-name/{name}) returns a plain number (the tenant ID).
   * @param name The username/name of the tenant.
   * @returns An Observable of the tenantId (number).
   */
  getTenantIdByUsername(name: string): Observable<number> {
    console.log(`TenantUpdateService: Attempting to fetch tenant ID for name: ${name}`);
    return this.http.get(`${this.apiGatewayBaseUrl}/id-by-name/${encodeURIComponent(name)}`, { responseType: 'text' }).pipe( // Expect text response
      map(text => {
        const id = parseInt(text, 10); // Parse the text response into a number
        if (isNaN(id) || id <= 0) {
          throw new Error(`Invalid tenant ID received for name ${name}: ${text}`);
        }
        return id;
      }),
      tap(id => console.log('TenantUpdateService: Received tenant ID:', id)),
      catchError(this.handleError)
    );
  }

  /**
   * Fetches the FULL Tenant object by their tenantId from the dedicated tenant details microservice.
   * Corresponds to GET http://localhost:8093/tenant/fetchById/{tenantId}
   * @param tenantId The numerical ID of the tenant.
   * @returns An Observable of the Tenant object.
   */
  getTenantDetailsById(tenantId: number): Observable<Tenant> {
    console.log(`TenantUpdateService: Attempting to fetch full tenant details for ID: ${tenantId}`);
    return this.http.get<Tenant>(`${this.tenantDetailsBaseUrl}/fetchById/${tenantId}`).pipe(
      tap(tenant => console.log('TenantUpdateService: Received full tenant details:', tenant)),
      catchError(this.handleError)
    );
  }

  /**
   * Sends an update request for a tenant.
   * @param tenantId The ID of the tenant to update (used in URL).
   * @param payload The data to update (name, email, contact, address).
   * @returns An Observable of the updated Tenant object (backend response).
   */
  updateTenant(tenantId: number, payload: TenantUpdatePayload): Observable<Tenant> {
    console.log(`TenantUpdateService: Updating tenant ID: ${tenantId} with payload:`, payload);
    // Assuming this update endpoint is still on 9092 or an appropriate base URL for CRUD
    return this.http.put<Tenant>(`${this.apiGatewayBaseUrl}/update/${tenantId}`, payload).pipe(
      tap(response => console.log('TenantUpdateService: Update successful, response:', response)),
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
    console.error('TenantUpdateService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}