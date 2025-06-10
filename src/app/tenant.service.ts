import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private baseUrl = 'http://localhost:9092/tenant'; // Adjust if your tenant service URL is different

  constructor(private http: HttpClient) { }

  getTenantIdByUsername(username: string): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/id-by-name/${encodeURIComponent(username)}`).pipe(
      catchError(error => {
        let errorMessage = `Failed to retrieve tenant ID for ${username}.`;
        if (error instanceof HttpErrorResponse) {
          if (error.status === 404) {
            errorMessage = `Tenant with username '${username}' not found.`;
          } else if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage = `An error occurred: ${error.error.message}`;
          } else {
            // Backend returned an unsuccessful response code.
            // The response body may contain clues.
            errorMessage = `Backend returned code ${error.status}, body was: ${error.error}`;
          }
        }
        console.error('TenantService.getTenantIdByUsername error:', error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }


  private handleError(error: any): Observable<never> {
    console.error('An error occurred in TenantService:', error);
    let errorMessage = 'Failed to fetch tenant ID. Please try again.';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Backend error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.status === 404) {
        errorMessage = 'Tenant not found for the given username.';
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}