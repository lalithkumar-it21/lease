import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})


export class PropertyService {
  private baseUrl = 'http://localhost:8092/property';

  constructor(private http: HttpClient) {}

  getAllProperties(): Observable<Property[]> {
    return this.http.get<Property[]>(`${this.baseUrl}/fetchAll`);
  }

  getPropertyById(propertyId: number): Observable<Property> {
    return this.http.get<Property>(`${this.baseUrl}/fetchById/${propertyId}`);
  }

  addProperty(property: Property): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/save`, property);
  }

  updateProperty(property: Property): Observable<Property> {
    return this.http.put<Property>(`${this.baseUrl}/update`, property);
  }

  deleteProperty(propertyId: number): Observable<string> {
    return this.http.delete<string>(`${this.baseUrl}/delete/${propertyId}`);
  }
}
export interface Property {
  propertyId: number;
  ownerId: number;
  address: string;
  rentAmount: number;
  period: number;
  propertyDetails: string;
  availabilityStatus: string;
}