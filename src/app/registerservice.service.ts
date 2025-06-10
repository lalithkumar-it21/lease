// src/app/registerservice.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class RegisterserviceService {
  form: RegisterUser;
  form2: Tenant;

  constructor(private client: HttpClient) { }

  path1 = "http://localhost:9092/auth/new";
  path2 = "http://localhost:9092/tenant/save";
  path3 = "http://localhost:9092/owner/save";

  registerUser(form: RegisterUser): Observable<any> {
    console.log("Registering user:", form);
    return this.client.post(this.path1, form, { responseType: 'text' });
  }

  registerCustomer(form: Tenant): Observable<any> {
    console.log("Registering customer:", form);
    return this.client.post(this.path2, form, { responseType: 'text' });
  }

  registerAgent(form: Owner): Observable<any> {
    console.log("Registering agent:", form);
    return this.client.post(this.path3, form, { responseType: 'text' });
  }

  registerBoth1(form: RegisterUser & Tenant): Observable<any> {
    console.log("Registering both user and customer:", form);
    return this.registerUser(form).pipe(
      switchMap(() => this.registerCustomer(form)),
      catchError((error) => {
        console.error("Registration failed:", error);
        return throwError(() => error);
      })
    );
  }

  registerBoth2(form: RegisterUser & Owner): Observable<any> {
    console.log("Registering both user and Agent:", form);
    return this.registerUser(form).pipe(
      switchMap(() => this.registerAgent(form)),
      catchError((error) => {
        console.error("Registration failed:", error);
        return throwError(() => error);
      })
    );
  }
}

export class RegisterUser {
  name: string;
  email: string;
  password: string;
  role: string;
}

export class Tenant {
  tenantId?: number;
  name: string;
  email: string;
  contact: string;
  address: string;
}

export class Owner {
  ownerId?: number;
  name: string;
  email: string;
  contact: string;
  address: string;
}

export interface Property {
  propertyId?: number;
  ownerId: number;
  propertyName: string;
  address: string;
  rentAmount: number;
  period: number;
  propertyDetails: string;
  image: string;
  availabilityStatus: 'AVAILABLE' | 'OCCUPIED' | 'UNDER_MAINTENANCE';
}

export interface Lease {
  leaseId?: number;
  propertyId: number;
  tenantId: number;
  ownerId: number;
  period: number; // Changed from number to string based on backend model
  startDate: string; // DD/MM/YYYY
  endDate: string; // DD/MM/YYYY
  agreementDetails: string;
  rentAmount: number;
  leaseStatus: 'ACTIVE' | 'EXTENDED' | 'TERMINATED'; // Corrected enum values
}

export interface Request {
  requestId?: number;
  tenantId: number;
  ownerId: number;
  propertyId: number;
  requestStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}