// src/app/property-create.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Property } from './registerservice.service'; // Import the Property interface

@Injectable({
  providedIn: 'root'
})
export class PropertyCreateService {
  private baseUrl = 'http://localhost:9092/property'; // Endpoint for saving property

  constructor(private http: HttpClient) { }

  /**
   * Saves a new property to the backend.
   * @param propertyData The property object to be saved. propertyId should be omitted as it's auto-generated.
   * @returns An Observable of a string response (e.g., success message).
   */
  saveProperty(propertyData: Property): Observable<string> {
    console.log('PropertyCreateService: Attempting to save new property:', propertyData);
    // Ensure propertyId is NOT sent in the payload as it's auto-generated
    const payload = { ...propertyData };
    delete payload.propertyId; // Remove propertyId from the payload if it somehow got there

    return this.http.post(`${this.baseUrl}/save`, payload, { responseType: 'text' }).pipe(
      tap(response => console.log('PropertyCreateService: Property saved successfully:', response)),
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
    console.error('PropertyCreateService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
