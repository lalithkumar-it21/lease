// src/app/auth.service.ts
import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
// Define possible user roles
export type UserRole = 'ADMIN' | 'TENANT' | 'OWNER' | 'UNAUTHENTICATED' | null;
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // isTenant() {
  //   throw new Error('Method not implemented.');
  // }

  isTenant(): boolean {
    const token = this.getToken();
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        // Assuming the role is stored in a 'roles' or similar field
        return decodedToken.roles?.includes('tenant') || false;
      } catch (e) {
        console.error('Error decoding token in isTenant:', e);
        return false;
      }
    }
    return false; // No token means not a tenant
  }


  isOwner(): boolean {
    const token = this.getToken();
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        // Assuming the role is stored in a 'roles' or similar field
        return decodedToken.roles?.includes('owner') || false;
      } catch (e) {
        console.error('Error decoding token in isOwner:', e);
        return false;
      }
    }
    return false; // No token means not a tenant
  }


  isAdmin(): boolean {
    const token = this.getToken();
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        // Assuming the role is stored in a 'roles' or similar field
        return decodedToken.roles?.includes('admin') || false;
      } catch (e) {
        console.error('Error decoding token in isAdmin:', e);
        return false;
      }
    }
    return false; // No token means not a tenant
  }
  private TOKEN_KEY = 'jwt_token'; // Key for storing the token in local storage

  constructor() { }

  /**
   * Stores the JWT token in local storage.
   * @param token The JWT string to store.
   */
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token); // <--- Uses TOKEN_KEY
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY); // <--- Uses TOKEN_KEY
  }

  /**
   * Removes the JWT token from local storage (e.g., on logout).
   */
  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Decodes a JWT and returns its payload.
   * IMPORTANT: This is a basic client-side decode. For production,
   * consider using a library like 'jwt-decode' for robust error handling
   * and validation, or rely on backend for token validation.
   * @param token The JWT string.
   * @returns The decoded payload object, or null if decoding fails.
   */
  decodeToken(): any | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    try {
      // JWT is base64 encoded, separated by dots (header.payload.signature)
      const payload = token.split('.')[1];
      // Decode base64 URL safe string
      const decodedPayload = JSON.parse(atob(payload));
      return decodedPayload;
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }

  /**
   * Extracts the username (subject) from the decoded JWT payload.
   * Assumes 'sub' claim holds the username/name. Adjust if your JWT uses a different claim.
   * @returns The username string or null if not found.
   */
  // getUsernameFromToken(): string | null {
  //   const decodedToken = this.decodeToken();
  //   return decodedToken ? decodedToken.sub : null; // 'sub' is the standard JWT claim for subject/username
  // }



  getRoleFromToken(): UserRole {
    const token = this.getToken();
    if (!token) {
      return 'UNAUTHENTICATED';
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // Decode base64 payload
      let role: string | string[] = payload.role || payload.roles; // Check for 'role' or 'roles'

      if (Array.isArray(role) && role.length > 0) {
        // If roles is an array, take the first one or combine if needed
        return role[0].toUpperCase() as UserRole;
      } else if (typeof role === 'string' && role) {
        // If roles is a comma-separated string or single string
        return role.split(',')[0].toUpperCase() as UserRole;
      }
      return 'UNAUTHENTICATED';
    } catch (e) {
      console.error('Error decoding JWT token or parsing role:', e);
      return 'UNAUTHENTICATED';
    }
  }

  getUsernameFromToken(): string | null {
    const token = this.getToken();//localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        // Assuming the username is in the 'sub' claim or another field like 'username'
        return decodedToken.sub || decodedToken.username || null;
      } catch (e) {
        console.error('Error decoding token:', e);
        return null;
      }
    }
    return null;
  }
  /**
   * Checks if a user is currently logged in (has a token).
   * More robust checks would include token expiry.
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}