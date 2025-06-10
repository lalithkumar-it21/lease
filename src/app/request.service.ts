// src/app/request.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Request } from './registerservice.service'; // Import the Request interface

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  private requestBaseUrl = 'http://localhost:9092/request'; // Assuming your Request microservice is here

  constructor(private http: HttpClient) { }

  saveRequest(request: Request): Observable<string> {
    console.log('RequestService: Saving request:', request);
    return this.http.post(`${this.requestBaseUrl}/save`, request, { responseType: 'text' }).pipe(
      tap(response => console.log('RequestService: Request saved successfully:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Fetches all requests made by a specific tenant.
   * Assumes a backend endpoint like /request/byTenant/{tenantId}
   * @param tenantId The ID of the tenant.
   * @returns An Observable of an array of Request objects.
   */
  getRequestsByTenantId(tenantId: number): Observable<Request[]> {
    console.log(`RequestService: Fetching requests for tenant ID: ${tenantId}`);
    return this.http.get<Request[]>(`${this.requestBaseUrl}/byTenant/${tenantId}`).pipe(
      tap(data => console.log('RequestService: Received tenant requests:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Fetches all requests related to properties owned by a specific owner.
   * Assumes a backend endpoint like /request/byOwner/{ownerId}
   * @param ownerId The ID of the owner.
   * @returns An Observable of an array of Request objects.
   */
  getRequestsByOwnerId(ownerId: number): Observable<Request[]> {
    console.log(`RequestService: Fetching requests for owner ID: ${ownerId}`);
    return this.http.get<Request[]>(`${this.requestBaseUrl}/byOwner/${ownerId}`).pipe(
      tap(data => console.log('RequestService: Received owner property requests:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Deletes a request by its ID.
   * Corresponds to DELETE http://localhost:9092/request/delete/{requestId}
   * @param requestId The ID of the request to delete.
   * @returns An Observable of a string response (e.g., success message).
   */
  deleteRequest(requestId: number): Observable<string> {
    console.log(`RequestService: Deleting request with ID: ${requestId}`);
    return this.http.delete(`${this.requestBaseUrl}/delete/${requestId}`, { responseType: 'text' }).pipe(
      tap(response => console.log('RequestService: Request deletion successful:', response)),
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
    console.error('RequestService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}