import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Owner } from './registerservice.service'; // Re-use the Owner interface

@Injectable({
  providedIn: 'root'
})
export class OwnerUpdateService {

  private ownerApiUrl = 'http://localhost:9092/owner'; // Base URL for owner microservice

  constructor(private http: HttpClient) { }

  /**
   * Fetches the current owner's profile details by ownerId.
   * @param ownerId The ID of the owner to fetch.
   * @returns An Observable of the Owner object.
   */
  getOwnerProfile(ownerId: number): Observable<Owner> {
    // Assuming your backend has an endpoint like GET /owner/{id}
    const url = `${this.ownerApiUrl}/${ownerId}`; // Example: GET /owner/{id}
    return this.http.get<Owner>(url).pipe(
      catchError(error => {
        console.error('Error fetching owner profile by ID:', error);
        return throwError(() => new Error('Could not fetch owner profile by ID.'));
      })
    );
  }

  /**
   * Sends updated owner profile data to the backend.
   * @param ownerId The ID of the owner to update.
   * @param updatedOwner The updated owner data.
   * @returns An Observable of the response from the backend (e.g., success message).
   */
  updateOwnerProfile(ownerId: number, updatedOwner: Partial<Owner>): Observable<any> {
    const url = `${this.ownerApiUrl}/update/${ownerId}`; // Assuming PUT /owner/update/{id}
    return this.http.put(url, updatedOwner, { responseType: 'text' }).pipe(
      catchError(error => {
        console.error('Error updating owner profile:', error);
        return throwError(() => new Error('Could not update owner profile.'));
      })
    );
  }
}