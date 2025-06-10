import { Component, OnInit } from '@angular/core'; // Add OnInit
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service'; // Import AuthService
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'header',
  standalone: true, // Assuming it's standalone, add if not present
  imports: [RouterLink, RouterOutlet, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit { // Implement OnInit
  role: string | null = null; // Initialize to null

  constructor(
    private router: Router,
    private authService: AuthService // Inject AuthService instead of LoginserviceService for auth state
  ) {}

  ngOnInit(): void {
    // This logic should be inside ngOnInit or a method called by it
    // Or, even better, use a getter for role if it needs to be reactive
    this.updateRoleFromToken();
  }

  // Method to update role, can be called on init or after login/logout
  updateRoleFromToken(): void {
    const token = this.authService.getToken();
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        this.role = decoded.roles ?? 'No role found';
        console.log("Header Role:", this.role);
      } catch (e) {
        console.error("Error decoding token in HeaderComponent:", e);
        this.role = null; // Clear role if token is invalid
      }
    } else {
      this.role = null; // No token, no role
    }
  }

  // Use AuthService.isLoggedIn() for the login status
  get isLogedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout(): void { // Change return type to void
   // confirm("Do you want to Logout?");
    if(confirm("Do you want to Logout?") === true){
    this.authService.removeToken(); // Use AuthService to remove token
   
    this.router.navigate(["/login"]);
    this.role = null;} // Clear role on logout
  }
}

interface JwtPayload {
  roles?: string;
  // Add other fields if needed, like 'sub' for username
}