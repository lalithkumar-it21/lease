import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class RegisterserviceService {
  form: RegisterUser ;
  form2:Tenant
  constructor(private client: HttpClient) { }

  path1 = "http://localhost:9092/auth/new";
  path2 = "http://localhost:9092/tenant/save";
  path3="http://localhost:9092/owner/save";

  // Register only the user
  registerUser(form: RegisterUser): Observable<any> {
    console.log("Registering user:", form);
    return this.client.post(this.path1, form, { responseType: 'text' });
  }

  // Register only the customer
  registerCustomer(form: Tenant): Observable<any> {
    console.log("Registering customer:", this.form2);
    return this.client.post(this.path2, form, { responseType: 'text' });
  }

  registerAgent(form: Owner): Observable<any> {
    console.log("Registering customer:", this.form2);
    return this.client.post(this.path3, form, { responseType: 'text' });
  }

  // Register both user and customer in sequence
  registerBoth1(form: RegisterUser & Tenant): Observable<any> {
    //form.policies=[]
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
  //  form.policies=[]
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
  name: string;
  email: string;
  contact: string;
  address: string;
 
 
}
export class Owner{
 name: string;
 email: string;
 contact: string;
 address: string;




}