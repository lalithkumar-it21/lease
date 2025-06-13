// src/app/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { CommonService } from '../common.service';
import { LoginserviceService } from '../loginservice.service';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'login',
  imports: [RouterLink, RouterOutlet, FormsModule, CommonModule, HeaderComponent], 
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  constructor(private router: Router, private commonService: CommonService, private logService: LoginserviceService, private access: ActivatedRoute, private authService: AuthService) {
   
  }

  token: string;

  validated(form: NgForm): any {
    console.log("validate function calling.......");
    console.log(form.value);

    this.logService.login(form.value).subscribe({
      next: (response: string) => {
        if (response && response.length > 0 && response.includes('.')) {
          this.authService.setToken(response); // Already correct here

          console.log("Login successful:", response);

          try {
            const decoded = jwtDecode<JwtPayload>(response);
            const roles: string = decoded.roles ?? 'No role found';
            console.log("Decoded Roles:", roles);

            // Consider using localStorage for role if it needs to persist
            // localStorage.setItem("role", roles); // Option to store role persistently
            sessionStorage.setItem("role", roles); // Current: keeps role only for session

            const role = roles.toLowerCase();
            if (role === 'owner') {
              this.router.navigate(["/owner-home"]);
            } else if (role === 'tenant') {
              this.router.navigate(["/tenant-home"]);
            } 
            else if (role === 'admin') {
              this.router.navigate(["/admin-home"]);}
              else {
              alert("Unknown user role. Please contact support.");
              this.authService.removeToken(); // <--- CHANGE: Use AuthService.removeToken()
              // this.logService.logout(); // This also calls removeToken(), potentially redundant
            }
          } catch (decodeError) {
            console.error("Error decoding JWT:", decodeError);
            alert("Login successful but failed to process user data. Please try again or contact support.");
            this.authService.removeToken(); // <--- CHANGE: Use AuthService.removeToken()
            // this.logService.logout();
          }
        } else {
          console.error("Login successful but received invalid token format:", response);
          alert("Login successful but invalid token received. Please try again.");
          this.authService.removeToken(); // <--- CHANGE: Use AuthService.removeToken()
          // this.logService.logout();
        }
      },
      error: (err) => {
        console.error("Login failed:", err);
        if (err.status === 403 || err.status === 401) {
          alert("Invalid credentials. Please try again.");
        } else {
          alert("Something went wrong. Please try later. Error: " + err.message);
        }
      }
    });
  }
}

interface JwtPayload {
  roles?: string;
  sub?: string;
  iat?: number;
  exp?: number;
}