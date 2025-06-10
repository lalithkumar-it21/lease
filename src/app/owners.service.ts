import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Owner } from './registerservice.service'; // Adjust path if needed

@Injectable({
  providedIn: 'root'
})
export class OwnersService {
  private baseUrl = 'http://localhost:9092/owner'; // Base URL for owner service

  constructor(private http: HttpClient) { }

  /**
   * Fetches all owner details.
   * @returns An Observable of an array of Owner objects.
   */
  getAllOwners(): Observable<Owner[]> {
    console.log('OwnerService: Fetching all owners...');
    return this.http.get<Owner[]>(`${this.baseUrl}/fetchAll`).pipe(
      tap(owners => console.log('OwnerService: Fetched owners:', owners)),
      catchError(this.handleError)
    );
  }

  /**
   * Creates a new owner.
   * @param owner The owner object to create (without ownerId).
   * @returns An Observable of the created Owner object.
   */
  createOwner(owner: Omit<Owner, 'ownerId'>): Observable<Owner> { // Omit 'ownerId' as it's auto-generated
    console.log('OwnerService: Creating new owner:', owner);
    return this.http.post<Owner>(`${this.baseUrl}/save`, owner).pipe(
      tap(response => console.log('OwnerService: Owner created:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Fetches a single owner by ID.
   * Useful for pre-filling an edit form.
   * @param ownerId The ID of the owner to fetch.
   * @returns An Observable of the Owner object.
   */
  getOwnerById(ownerId: number): Observable<Owner> {
    console.log(`OwnerService: Fetching owner with ID: ${ownerId}`);
    return this.http.get<Owner>(`${this.baseUrl}/fetchById/${ownerId}`).pipe(
      tap(owner => console.log('OwnerService: Fetched owner:', owner)),
      catchError(this.handleError)
    );
  }

  /**
   * Updates an existing owner.
   * @param ownerId The ID of the owner to update.
   * @param owner The updated owner object.
   * @returns An Observable of the updated Owner object.
   */
  updateOwner(ownerId: number, owner: Owner): Observable<Owner> {
    console.log(`OwnerService: Updating owner ID: ${ownerId} with data:`, owner);
    return this.http.put<Owner>(`${this.baseUrl}/update/${ownerId}`, owner).pipe(
      tap(response => console.log('OwnerService: Owner updated:', response)),
      catchError(this.handleError)
    );
  }

  

  /**
   * Deletes an owner and their associated properties.
   * @param ownerId The ID of the owner to delete.
   * @returns An Observable of a string response (e.g., success message).
   */
  deleteOwner(ownerId: number): Observable<string> {
    console.log(`OwnerService: Deleting owner and properties with ID: ${ownerId}`);
    return this.http.delete(`${this.baseUrl}/deleteOwnerAndProperties/${ownerId}`, { responseType: 'text' }).pipe(
      tap(response => console.log('OwnerService: Owner deleted response:', response)),
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
    console.error('OwnerService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}