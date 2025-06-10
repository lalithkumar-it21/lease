// src/app/property-update.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Property } from './registerservice.service'; // Import the Property interface

// Define the payload for property updates
export interface PropertyUpdatePayload {
  propertyName: string;
  ownerId: number;
  address: string;
  rentAmount: number;
  period: number;
  image: string;
  propertyDetails: string;
  availabilityStatus: 'AVAILABLE' | 'OCCUPIED' | 'UNDER_MAINTENANCE';
}

@Injectable({
  providedIn: 'root'
})
export class PropertyUpdateService {
  private baseUrl = 'http://localhost:9092/property'; // Assuming property endpoints are on API Gateway

  constructor(private http: HttpClient) { }

  /**
   * Fetches all properties from the backend.
   * Corresponds to GET http://localhost:9092/property/fetchAll
   * @returns An Observable of an array of Property objects.
   */
  fetchAllProperties(): Observable<Property[]> {
    console.log('PropertyUpdateService: Fetching all properties.');
    return this.http.get<Property[]>(`${this.baseUrl}/fetchAll`).pipe(
      tap(data => console.log('PropertyUpdateService: Received all properties:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Fetches a single property by its ID.
   * Corresponds to GET http://localhost:9092/property/fetchById/{propertyId}
   * @param propertyId The ID of the property to fetch.
   * @returns An Observable of a single Property object.
   */
  fetchPropertyById(propertyId: number): Observable<Property> {
    console.log(`PropertyUpdateService: Fetching property with ID: ${propertyId}`);
    return this.http.get<Property>(`${this.baseUrl}/fetchById/${propertyId}`).pipe(
      tap(data => console.log('PropertyUpdateService: Received property by ID:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Updates an existing property by its ID.
   * Corresponds to PUT http://localhost:9092/property/update/{propertyId}
   * @param propertyId The ID of the property to update.
   * @param payload The data to update (excluding propertyId itself).
   * @returns An Observable of the updated Property object (backend response).
   */
  updateProperty(propertyId: number, payload: PropertyUpdatePayload): Observable<Property> {
    console.log(`PropertyUpdateService: Updating property ID: ${propertyId} with payload:`, payload);
    return this.http.put<Property>(`${this.baseUrl}/update/${propertyId}`, payload).pipe(
      tap(response => console.log('PropertyUpdateService: Property updated successfully:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Deletes a property by its ID.
   * Corresponds to DELETE http://localhost:9092/property/delete/{propertyId}
   * @param propertyId The ID of the property to delete.
   * @returns An Observable of a string response (e.g., success message).
   */
  deleteProperty(propertyId: number): Observable<string> {
    console.log(`PropertyUpdateService: Deleting property with ID: ${propertyId}`);
    return this.http.delete(`${this.baseUrl}/delete/${propertyId}`, { responseType: 'text' }).pipe(
      tap(response => console.log('PropertyUpdateService: Property deletion successful:', response)),
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
    console.error('PropertyUpdateService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}