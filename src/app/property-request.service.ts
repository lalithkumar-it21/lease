// src/app/property-request/property-request.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { Request } from './registerservice.service';
@Injectable({
  providedIn: 'root'
})
export class PropertyRequestService {
  // Base URL for the Request microservice endpoints
  private requestBaseUrl = 'http://localhost:9092/request';

  constructor(private http: HttpClient) { }

  /**
   * Fetches all property requests associated with a specific owner.
   * Corresponds to GET http://localhost:9092/request/byOwner/{ownerId}
   * @param ownerId The ID of the owner.
   * @returns An Observable of an array of Request objects.
   */
  getRequestsByOwnerId(ownerId: number): Observable<Request[]> {
    console.log(`PropertyRequestService: Fetching requests for owner ID: ${ownerId}`);
    return this.http.get<Request[]>(`${this.requestBaseUrl}/byOwner/${ownerId}`).pipe(
      tap(data => console.log('PropertyRequestService: Received requests by owner:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Updates an existing request's status.
   * Corresponds to PUT http://localhost:9092/request/update
   * @param requestPayload The Request object with the updated status.
   * @returns An Observable of the updated Request object from the backend.
   */
  updateRequestStatus(requestPayload: Request): Observable<Request> {
    console.log('PropertyRequestService: Updating request status with payload:', requestPayload);
    // Assuming backend takes the full Request object in the body for update
    return this.http.put<Request>(`${this.requestBaseUrl}/update`, requestPayload).pipe(
      tap(response => console.log('PropertyRequestService: Request status updated successfully:', response)),
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
    console.log(`PropertyRequestService: Deleting request with ID: ${requestId}`);
    return this.http.delete(`${this.requestBaseUrl}/delete/${requestId}`, { responseType: 'text' }).pipe(
      tap(response => console.log('PropertyRequestService: Request deletion successful:', response)),
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
    console.error('PropertyRequestService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}