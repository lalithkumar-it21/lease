// src/app/loginservice.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs'; // Keep throwError if used in handleError
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service'; // <--- NEW: Import AuthService

@Injectable({
  providedIn: 'root'
})
export class LoginserviceService {
  user: LoginUser;
  path = "http://localhost:9092/auth/authenticate";

  constructor(private client: HttpClient, private router: Router, private authService: AuthService) { } // <--- NEW: Inject AuthService

  login(user: LoginUser) {
    console.log("In service");
    console.log(user);
    return this.client.post(this.path, user, { responseType: 'text' }).pipe(
      tap(token => {
        // Token handling is now delegated to AuthService in LoginComponent
        console.log("Login service received token, passing to component.");
      }),
      catchError(error => { // Add specific error handling for login
        console.error("Login service error:", error);
        return throwError(() => error);
      })
    );
  }

  // Remove getJWT, removeToken, and logStatus as they are now handled by AuthService
  // You might want to rename this `getStoredToken` if you still need it, but AuthService is better.
  // getJWT(): string {
  //   return this.authService.getToken(); // Delegate to AuthService
  // }

  // removeToken() {
  //   this.authService.removeToken(); // Delegate to AuthService
  //   return true;
  // }

  // This property is no longer needed; use authService.isLoggedIn() instead.
  // public isLogedIn = false; // Remove this

  // logStatus(): boolean { // Remove this; use authService.isLoggedIn()
  //   console.log(this.authService.isLoggedIn());
  //   return this.authService.isLoggedIn();
  // }

  logout(): boolean {
    confirm("do you want to Logout? ");
    this.router.navigate(["/login"]);
    this.authService.removeToken(); // <--- CHANGE: Use AuthService to remove token
    // localStorage.clear(); // <--- AVOID this unless you want to clear ALL local storage
    return false; // Return false after logout
  }
}
export class LoginUser {
  name: string;
  password: string;
}