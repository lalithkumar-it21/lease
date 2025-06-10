// src/app/tenant-home/tenant-home.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs'; // 'of' for returning simple observables

@Injectable({
  providedIn: 'root'
})
export class TenantHomeService {
   private baseUrl = 'http://localhost:9092/tenant'; // Example base URL if you need to fetch data

  constructor(private http: HttpClient) { }

  // Example: A method that might fetch some tenant-specific stats later
   getTenantDashboardStats(tenantId: number): Observable<any> {
     return this.http.get(`${this.baseUrl}/fetchById/${tenantId}`);
   }

  // Placeholder method for now
  getWelcomeMessage(): Observable<string> {
    return of('Welcome to your Tenant Dashboard!');
  }
}