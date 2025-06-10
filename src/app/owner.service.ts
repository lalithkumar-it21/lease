import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Owner } from './registerservice.service'; // Adjust path if needed

@Injectable({
  providedIn: 'root'
})
export class OwnerService {
  private gatewayUrl = 'http://localhost:9092/owner'; // Your API Gateway URL for owner-related endpoints

  constructor(private http: HttpClient) { }

  /**
   * Fetches the owner ID from the backend using the owner's email.
   * @param email The email of the owner.
   * @returns An Observable that emits the owner ID (number).
   */
  getOwnerIdByEmail(email: string): Observable<number> {
    const url = `${this.gatewayUrl}/id-by-email/${email}`;
    return this.http.get<number>(url);
  }

  
  // You can add other owner-related API calls here if needed in the future
  // For example:
  // getOwnerDetails(ownerId: number): Observable<Owner> { ... }
  // updateOwner(owner: Owner): Observable<Owner> { ... }
}