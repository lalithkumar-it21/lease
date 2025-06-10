// src/app/property-list/property-list.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // HttpHeaders is not needed here
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Property } from './registerservice.service'; // Adjust path if needed

@Injectable({
  providedIn: 'root'
})
export class PropertyListService {
  private baseUrl = 'http://localhost:9092/property';

  constructor(private http: HttpClient) { }

  // No getAuthHeaders() method here! The interceptor handles it.

  getAllProperties(): Observable<Property[]> {
    return this.http.get<Property[]>(`${this.baseUrl}/fetchAll`).pipe(
      catchError(this.handleError)
    );
  }

  getPropertiesByAddress(address: string): Observable<Property[]> {
    return this.http.get<Property[]>(`${this.baseUrl}/propertiesByAddress/${encodeURIComponent(address)}`).pipe(
      catchError(this.handleError)
    );
  }

  getPropertiesByRentRange(minRent: number, maxRent: number): Observable<Property[]> {
    return this.http.get<Property[]>(`${this.baseUrl}/propertiesByRentRange/${minRent}/${maxRent}`).pipe(
      catchError(this.handleError)
    );
  }
  getPropertiesByStatus(status: string): Observable<Property[]> {
    console.log(`PropertyListService: Fetching properties by status: ${status}`);
    return this.http.get<Property[]>(`${this.baseUrl}/propertiesByStatus/${encodeURIComponent(status)}`).pipe(
      catchError(this.handleError)
    );
  }
  private handleError(error: any): Observable<never> {
    console.error('An error occurred in PropertyListService:', error);
    let errorMessage = 'An unknown error occurred!';
    // ... (rest of your handleError logic)
    return throwError(() => new Error(errorMessage));
  }
}