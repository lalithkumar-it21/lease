// src/app/admin-tenant.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Tenant } from './registerservice.service'; // Reusing existing Tenant interface

@Injectable({
  providedIn: 'root'
})
export class AdminTenantService {
  private tenantBaseUrl = 'http://localhost:9092/tenant'; // Base URL for fetchAll, delete
  private tenantUpdateUrl = 'http://localhost:9092/tenant'; // Base URL for update (as per your request)

  constructor(private http: HttpClient) { }

  /**
   * Fetches all tenant details from the backend.
   * @returns An Observable of an array of Tenant objects.
   */
  fetchAllTenants(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>(`${this.tenantBaseUrl}/fetchAll`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Updates an existing tenant's details.
   * @param tenantId The ID of the tenant to update.
   * @param tenantData The updated tenant object (excluding tenantId and name if disabled on UI).
   * @returns An Observable of the updated Tenant object.
   */
  updateTenant(tenantId: number, tenantData: Tenant): Observable<Tenant> {
    // Note: The endpoint path might vary depending on how your backend handles it.
    // Assuming PUT /tenant/update/{tenantId}
    return this.http.put<Tenant>(`${this.tenantUpdateUrl}/update/${tenantId}`, tenantData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Deletes a tenant by their ID.
   * @param tenantId The ID of the tenant to delete.
   * @returns An Observable of the deletion response (e.g., success message).
   */
  deleteTenant(tenantId: number): Observable<string> {
    return this.http.delete(`${this.tenantBaseUrl}/delete/${tenantId}`, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
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
    console.error('AdminTenantService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
