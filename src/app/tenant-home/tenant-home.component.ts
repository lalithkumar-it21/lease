// src/app/tenant-home/tenant-home.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router'; // Import Router and RouterLink
import { AuthService } from '../auth.service'; // Assuming AuthService exists

@Component({
  selector: 'tenant-home',
  standalone: true,
  imports: [CommonModule, RouterOutlet,RouterLink], // RouterLink is needed for redirection in template
  templateUrl: './tenant-home.component.html',
  styleUrls: ['./tenant-home.component.css'] // Assuming you might have a tenant-home.component.css
})
export class TenantHomeComponent implements OnInit {
  username: string | null = null; // To display "Welcome Customer, [Name]"

  constructor(
    private authService: AuthService,
    private router: Router // Inject Router for potential imperative navigation (though routerLink is used here)
  ) { }

  ngOnInit(): void {
    // Get the username from the token, similar to how owner-home would get it
    this.username = this.authService.getUsernameFromToken();

    // Optional: If no username, redirect to login (similar to owner-update logic)
    if (!this.username) {
      console.warn('No username found for tenant. Redirecting to login.');
      this.router.navigate(['/login']);
    }
  }

  // Optional: If you wanted to navigate imperatively (e.g., from a button click event)
  // navigateTo(route: string): void {
  //   this.router.navigate([route]);
  // }
}