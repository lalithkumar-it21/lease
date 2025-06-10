// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { HomeComponent } from './home/home.component';

import { LoginserviceService } from './loginservice.service'; // Keep if you still need it for other reasons
import { AuthService } from './auth.service'; // <--- NEW: Import AuthService

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent,HomeComponent,RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Lease';

  constructor(private logClient:LoginserviceService, private authService: AuthService){ // <--- NEW: Inject AuthService
  }

  // Use authService.isLoggedIn() for login status
  get isLogedIn(): boolean {
    return this.authService.isLoggedIn();
  }
}