// src/app/owner-update.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Owner } from './registerservice.service'; // Ensure Owner interface is imported

// Define the payload structure for updating an owner.
export interface OwnerUpdatePayload {
  name: string;
  email: string;
  contact: string;
  address: string;
}

@Injectable({
  providedIn: 'root'
})
export class OwnerUpdateService {
  private ownerBaseUrl = 'http://localhost:9092/owner'; // Adjusted to API Gateway 9092 for consistency

  constructor(private http: HttpClient) { }

  /**
   * Fetches owner ID by username.
   * Corresponds to GET http://localhost:9092/owner/id-by-name/{name}
   * @param username The owner's username.
   * @returns An Observable of the owner ID (number).
   */
  getOwnerIdByName(username: string): Observable<number> {
    console.log(`OwnerUpdateService: Fetching owner ID for username: ${username}`);
    return this.http.get(`${this.ownerBaseUrl}/id-by-name/${encodeURIComponent(username)}`, { responseType: 'text' }).pipe(
      map(text => {
        const id = parseInt(text, 10);
        if (isNaN(id) || id <= 0) {
          throw new Error(`Invalid owner ID received for name ${username}: ${text}`);
        }
        return id;
      }),
      tap(id => console.log('OwnerUpdateService: Received owner ID:', id)),
      catchError(this.handleError)
    );
  }


  getAllOwners(): Observable<Owner[]> {
    console.log('OwnerService: Fetching all owners...');
    return this.http.get<Owner[]>(`${this.ownerBaseUrl}/fetchAll`).pipe(
      tap(owners => console.log('OwnerService: Fetched owners:', owners)),
      catchError(this.handleError)
    );
  }
  /**
   * Fetches full owner details by owner ID.
   * Corresponds to GET http://localhost:9092/owner/fetchById/{ownerId}
   * @param ownerId The ID of the owner to fetch.
   * @returns An Observable of the Owner object.
   */
  getOwnerById(ownerId: number): Observable<Owner> {
    console.log(`OwnerUpdateService: Fetching owner details for ID: ${ownerId}`);
    return this.http.get<Owner>(`${this.ownerBaseUrl}/fetchById/${ownerId}`).pipe(
      tap(owner => console.log('OwnerUpdateService: Received owner details:', owner)),
      catchError(this.handleError)
    );
  }

  /**
   * Updates owner details.
   * Corresponds to PUT http://localhost:9092/owner/update/{ownerId}
   * @param ownerId The ID of the owner to update (used in URL if endpoint is by ID).
   * @param payload The updated Owner data.
   * @returns An Observable of a string response (assuming backend returns text or success object).
   */
  updateOwner(ownerId: number, payload: OwnerUpdatePayload): Observable<string> {
    console.log(`OwnerUpdateService: Updating owner ID: ${ownerId} with payload:`, payload);
    // Assuming the update endpoint is by ID, and expects payload in body
    return this.http.put(`${this.ownerBaseUrl}/update/${ownerId}`, payload, { responseType: 'text' }).pipe(
      tap(response => console.log('Owner update response:', response)),
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
    console.error('OwnerUpdateService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}